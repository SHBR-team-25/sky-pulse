package com.skypulse.positions;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.skypulse.positions.api.AirportsController;
import com.skypulse.positions.model.Airport;
import com.skypulse.positions.model.AirportDirectory;
import com.skypulse.positions.repository.AirportRepository;
import com.skypulse.positions.service.AirportsService;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(AirportsController.class)
@Import({AirportsService.class, AirportsControllerTest.StubRepositoryConfig.class})
class AirportsControllerTest {

    @TestConfiguration
    static class StubRepositoryConfig {

        @Bean
        AirportRepository airportRepository() {
            return () -> new AirportDirectory(
                    List.of(
                            new Airport("UUEE", "SVO", "Sheremetyevo International Airport", "large_airport",
                                    "Moscow", "RU", 55.976858, 37.41121),
                            new Airport("LFPG", "CDG", "Charles de Gaulle International Airport", "large_airport",
                                    "Paris", "FR", 49.00896, 2.554117),
                            new Airport("RU-0796", null, "Sheremetyevo Heliport", "heliport",
                                    "Sheremetyevo", "RU", 47.34019, 134.27342)),
                    1786000000L);
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @Test
    void returnsEnvelopeWithAirports() throws Exception {
        mockMvc.perform(get("/api/airports"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.asOf").value(1786000000L))
                .andExpect(jsonPath("$.total").value(2))
                .andExpect(jsonPath("$.page").value(1))
                .andExpect(jsonPath("$.pageSize").value(50))
                .andExpect(jsonPath("$.items[0].icao").value("UUEE"))
                .andExpect(jsonPath("$.items[0].iata").value("SVO"))
                .andExpect(jsonPath("$.items[0].city").value("Moscow"))
                .andExpect(jsonPath("$.items[0].country").value("RU"))
                .andExpect(jsonPath("$.items[0].position.lat").value(55.976858))
                .andExpect(jsonPath("$.items[0].position.lon").value(37.41121));
    }

    @Test
    void appliesSearchAndCountryFilters() throws Exception {
        mockMvc.perform(get("/api/airports?search=heathrow"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isEmpty())
                .andExpect(jsonPath("$.total").value(0));

        mockMvc.perform(get("/api/airports?country=FR"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].icao").value("LFPG"));
    }

    @Test
    void appliesBoundingBoxInLonLatOrder() throws Exception {
        mockMvc.perform(get("/api/airports?lonMin=36&latMin=55&lonMax=38.5&latMax=56.5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.items[0].icao").value("UUEE"));
    }

    // Как и в /api/flights/live, неполный набор координат фильтром не считается.
    @Test
    void ignoresIncompleteBoundingBox() throws Exception {
        mockMvc.perform(get("/api/airports?lonMin=36&latMin=55"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(2));
    }

    @Test
    void answersWithoutErrorOnGarbageParameters() throws Exception {
        mockMvc.perform(get("/api/airports?page=0&pageSize=100000&country=___&search=%27%20or%20100%25"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(1))
                .andExpect(jsonPath("$.pageSize").value(500))
                .andExpect(jsonPath("$.items").isEmpty());
    }

    @Test
    void rejectsNonNumericPaging() throws Exception {
        mockMvc.perform(get("/api/airports?page=abc"))
                .andExpect(status().isBadRequest());
    }
}
