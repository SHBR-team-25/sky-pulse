package com.skypulse.positions;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.skypulse.positions.api.FlightsController;
import com.skypulse.positions.api.dto.BoundingBox;
import com.skypulse.positions.model.Position;
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
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;

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
                    throw new ResourceAccessException("YT proxy unreachable");
                }

                @Override
                public Optional<Position> latestByIcao24(String icao24) {
                    throw HttpServerErrorException.create(
                            org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR,
                            "Internal Server Error", null, null, null);
                }

                @Override
                public List<Position> historyByIcao24(String icao24, long sinceSeconds) {
                    throw new IllegalStateException("Не удалось разобрать строку ответа YT");
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

    @Test
    void reportsYtErrorResponseAsServiceUnavailable() throws Exception {
        mockMvc.perform(get("/api/flights/abc123"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    // Любая другая необработанная ошибка тоже обязана прийти с message, а не
    // дефолтным телом Spring, в котором показывать пользователю нечего.
    @Test
    void reportsUnexpectedFailureAsInternalErrorWithMessage() throws Exception {
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
}
