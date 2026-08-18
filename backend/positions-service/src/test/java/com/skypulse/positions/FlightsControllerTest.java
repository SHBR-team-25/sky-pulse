package com.skypulse.positions;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.skypulse.positions.api.FlightsController;
import com.skypulse.positions.model.BoundingBox;
import com.skypulse.positions.model.Position;
import com.skypulse.positions.model.TrackPoint;
import com.skypulse.positions.repository.PositionRepository;
import com.skypulse.positions.service.PositionsService;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(FlightsController.class)
@Import({PositionsService.class, FlightsControllerTest.StubRepositoryConfig.class})
class FlightsControllerTest {

    private static final Position SAMPLE = new Position(
            "abc123", "SVR1234", "Russia", 1786841273L,
            55.75, 37.62, 10600.0, false, 240.0, 92.0,
            "Airbus", "A320", "Some Airline");

    @TestConfiguration
    static class StubRepositoryConfig {

        @Bean
        PositionRepository positionRepository() {
            return new PositionRepository() {

                @Override
                public List<Position> currentPositions(BoundingBox area) {
                    return area == null || area.contains(SAMPLE.lat(), SAMPLE.lon())
                            ? List.of(SAMPLE)
                            : List.of();
                }

                @Override
                public Optional<Position> latestByIcao24(String icao24) {
                    return SAMPLE.icao24().equals(icao24) ? Optional.of(SAMPLE) : Optional.empty();
                }

                @Override
                public List<TrackPoint> historyByIcao24(String icao24, long sinceSeconds) {
                    return latestByIcao24(icao24)
                            .map(p -> List.of(new TrackPoint(p.timePosition(), p.lat(), p.lon(), p.baroAltitude())))
                            .orElseGet(List::of);
                }
            };
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @Test
    void returnsCurrentPositions() throws Exception {
        mockMvc.perform(get("/api/flights/live"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].icao24").value("abc123"))
                .andExpect(jsonPath("$[0].originCountry").value("Russia"))
                .andExpect(jsonPath("$[0].baroAltitude").value(10600.0))
                .andExpect(jsonPath("$[0].manufacturername").value("Airbus"))
                .andExpect(jsonPath("$[0].model").value("A320"));
    }

    @Test
    void appliesBoundingBoxFilter() throws Exception {
        mockMvc.perform(get("/api/flights/live?lonMin=0&latMin=0&lonMax=10&latMax=10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    // Частичный набор координат фильтром не считается — отдаём всё.
    @Test
    void ignoresIncompleteBoundingBox() throws Exception {
        mockMvc.perform(get("/api/flights/live?lonMin=0&latMin=0"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].icao24").value("abc123"));
    }

    @Test
    void returnsLatestByIcao24() throws Exception {
        mockMvc.perform(get("/api/flights/abc123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.callsign").value("SVR1234"))
                .andExpect(jsonPath("$.trueTrack").value(92.0))
                .andExpect(jsonPath("$.model").value("A320"));
    }

    // Формат кода верный, борта в выдаче нет — это именно «не найдено».
    @Test
    void returns404ForUnknownAircraft() throws Exception {
        mockMvc.perform(get("/api/flights/ffffff"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    // А синтаксически невозможный код — ошибка ввода, и одинаковая на обеих
    // ручках: раньше карточка отвечала 404, а трек — пустым массивом и 200.
    @Test
    void rejectsMalformedIcao24OnBothEndpoints() throws Exception {
        mockMvc.perform(get("/api/flights/ZZZ"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").isNotEmpty());
        mockMvc.perform(get("/api/flights/ZZZ/track"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    // Отрицательное окно переполняло вычитание порога и снимало отсечку
    // по времени — запрос выгребал историю борта целиком.
    @Test
    void rejectsTrackWindowOutsideTheAllowedRange() throws Exception {
        mockMvc.perform(get("/api/flights/abc123/track?sinceSeconds=0"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/flights/abc123/track?sinceSeconds=-9223372036854775000"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/flights/abc123/track?sinceSeconds=86401"))
                .andExpect(status().isBadRequest());
    }

    // Spring разбирает NaN как обычный Double, и такая рамка уезжала в QL,
    // а клиент получал 503 «источник недоступен» вместо своей же ошибки.
    @Test
    void rejectsCoordinatesThatAreNotOnTheMap() throws Exception {
        mockMvc.perform(get("/api/flights/live?lonMin=NaN&latMin=NaN&lonMax=NaN&latMax=NaN"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").isNotEmpty());
        mockMvc.perform(get("/api/flights/live?lonMin=0&latMin=0&lonMax=10&latMax=200"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void returnsTrackPoints() throws Exception {
        mockMvc.perform(get("/api/flights/abc123/track"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].timePosition").value(1786841273L))
                .andExpect(jsonPath("$[0].lat").value(55.75));
    }
}
