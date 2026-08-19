package com.skypulse.positions;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.skypulse.positions.api.AirportsController;
import com.skypulse.positions.api.PipelineStatusController;
import com.skypulse.positions.repository.AirportRepository;
import com.skypulse.positions.repository.PipelineStatusRepository;
import com.skypulse.positions.repository.exception.DataSourceUnavailableException;
import com.skypulse.positions.service.AirportsService;
import com.skypulse.positions.service.PipelineStatusService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Отказ источника обязан выглядеть одинаково на всех ручках, а не только
 * на той, где про это вспомнили при написании теста.
 */
@WebMvcTest({AirportsController.class, PipelineStatusController.class})
@Import({AirportsService.class, PipelineStatusService.class,
        SourceUnavailableResponseTest.FailingRepositoryConfig.class})
class SourceUnavailableResponseTest {

    @TestConfiguration
    static class FailingRepositoryConfig {

        @Bean
        AirportRepository airportRepository() {
            return () -> {
                throw new DataSourceUnavailableException("Запрос read_table в YTsaurus не удался");
            };
        }

        @Bean
        PipelineStatusRepository pipelineStatusRepository() {
            return () -> {
                throw new DataSourceUnavailableException("Запрос select_rows в YTsaurus не удался");
            };
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @Test
    void airportsReportUnavailableSourceWithTheSharedErrorBody() throws Exception {
        mockMvc.perform(get("/api/airports"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.status").value(503))
                .andExpect(jsonPath("$.error").value("Service Unavailable"))
                .andExpect(jsonPath("$.message").isNotEmpty())
                .andExpect(jsonPath("$.timestamp").isNotEmpty());
    }

    @Test
    void pipelineStatusReportsUnavailableSourceWithTheSharedErrorBody() throws Exception {
        mockMvc.perform(get("/api/pipeline-status"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.status").value(503))
                .andExpect(jsonPath("$.message").isNotEmpty());
    }
}
