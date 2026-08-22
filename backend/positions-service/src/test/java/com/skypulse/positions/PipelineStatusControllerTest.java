package com.skypulse.positions;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.skypulse.positions.api.PipelineStatusController;
import com.skypulse.positions.model.PipelineStatus;
import com.skypulse.positions.repository.PipelineStatusRepository;
import com.skypulse.positions.service.PipelineStatusService;
import java.time.Instant;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(PipelineStatusController.class)
@Import({PipelineStatusService.class, PipelineStatusControllerTest.StubRepositoryConfig.class})
class PipelineStatusControllerTest {

    @TestConfiguration
    static class StubRepositoryConfig {

        static final AtomicReference<Optional<PipelineStatus>> LATEST = new AtomicReference<>(Optional.empty());

        @Bean
        PipelineStatusRepository pipelineStatusRepository() {
            return LATEST::get;
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @Test
    void returnsFreshStatus() throws Exception {
        long now = Instant.now().getEpochSecond();
        StubRepositoryConfig.LATEST.set(Optional.of(new PipelineStatus("ok", now, null)));

        mockMvc.perform(get("/api/pipeline-status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"))
                .andExpect(jsonPath("$.lastSuccessAt").value(now))
                .andExpect(jsonPath("$.resumesAt").doesNotExist())
                .andExpect(jsonPath("$.stale").value(false));
    }

    // Пустая pipeline_job_state — это «состояние неизвестно», и молча показывать
    // пустую карту в этом случае нельзя.
    @Test
    void reportsEmptyJobStateAsUnknownAndStale() throws Exception {
        StubRepositoryConfig.LATEST.set(Optional.empty());

        mockMvc.perform(get("/api/pipeline-status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("unknown"))
                .andExpect(jsonPath("$.lastSuccessAt").doesNotExist())
                .andExpect(jsonPath("$.stale").value(true));
    }

    @Test
    void reportsStoppedWatermarkAsStale() throws Exception {
        long longAgo = Instant.now().getEpochSecond() - 3600;
        StubRepositoryConfig.LATEST.set(Optional.of(new PipelineStatus("ok", longAgo, null)));

        mockMvc.perform(get("/api/pipeline-status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"))
                .andExpect(jsonPath("$.stale").value(true));
    }
}
