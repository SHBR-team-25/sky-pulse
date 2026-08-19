package com.skypulse.positions;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.skypulse.positions.api.FlightsController;
import com.skypulse.positions.model.BoundingBox;
import com.skypulse.positions.model.Position;
import com.skypulse.positions.model.TrackPoint;
import com.skypulse.positions.repository.PositionRepository;
import com.skypulse.positions.repository.exception.DataSourceRejectedException;
import com.skypulse.positions.repository.exception.DataSourceUnavailableException;
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
@Import({PositionsService.class, ApiExceptionHandlerTest.FailingRepositoryConfig.class})
class ApiExceptionHandlerTest {

    @TestConfiguration
    static class FailingRepositoryConfig {

        @Bean
        PositionRepository positionRepository() {
            return new PositionRepository() {

                @Override
                public List<Position> currentPositions(BoundingBox area) {
                    throw new DataSourceUnavailableException("Запрос select_rows в YTsaurus не удался");
                }

                @Override
                public Optional<Position> latestByIcao24(String icao24) {
                    throw new DataSourceUnavailableException(
                            "YTsaurus вернул неразбираемый ответ: <html>502 Bad Gateway</html>");
                }

                @Override
                public List<TrackPoint> historyByIcao24(String icao24, long sinceSeconds) {
                    throw new DataSourceRejectedException("select_rows", 400, null);
                }
            };
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @Test
    void reportsUnreachableYtAsServiceUnavailableWithMessage() throws Exception {
        mockMvc.perform(get("/api/flights/live"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.status").value(503))
                .andExpect(jsonPath("$.error").value("Service Unavailable"))
                .andExpect(jsonPath("$.message").isNotEmpty())
                .andExpect(jsonPath("$.timestamp").isNotEmpty());
    }

    // Битый ответ источника — тоже 503, а не 500: сервис исправен, и повторить
    // запрос осмысленно.
    @Test
    void reportsMalformedYtResponseAsServiceUnavailable() throws Exception {
        mockMvc.perform(get("/api/flights/abc123"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    // А вот отклонённый источником запрос — наш баг, и текст ответа YT наружу
    // не уходит: у клиента только «внутренняя ошибка».
    @Test
    void reportsRejectedRequestAsInternalErrorWithMessage() throws Exception {
        mockMvc.perform(get("/api/flights/abc123/track"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.status").value(500))
                .andExpect(jsonPath("$.message").value("Внутренняя ошибка сервиса"));
    }

    // Перехват Exception не должен превращать ошибки самого Spring MVC в 500.
    @Test
    void keepsSpringMvcStatusForBadParameter() throws Exception {
        mockMvc.perform(get("/api/flights/abc123/track?sinceSeconds=нет"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    // Ошибки самого Spring MVC тоже обязаны прийти в общем формате тела.
    @Test
    void keepsSharedBodyForUnsupportedMethodAndUnknownPath() throws Exception {
        mockMvc.perform(post("/api/flights/live"))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(jsonPath("$.status").value(405))
                .andExpect(jsonPath("$.message").isNotEmpty());
        mockMvc.perform(get("/api/flights/live/nope"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").isNotEmpty());
    }
}
