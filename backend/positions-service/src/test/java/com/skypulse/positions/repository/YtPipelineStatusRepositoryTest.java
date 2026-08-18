package com.skypulse.positions.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skypulse.positions.model.PipelineStatus;
import org.junit.jupiter.api.Test;

class YtPipelineStatusRepositoryTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void mapsPausedHeartbeatRow() throws Exception {
        JsonNode row = objectMapper.readTree("""
                {
                  "service": "ingest", "status": "budget_exhausted",
                  "updated_at": 1786841273, "last_success_at": 1786841270,
                  "resumes_at": 1786860000, "credits_remaining": 0
                }
                """);

        PipelineStatus status = YtPipelineStatusRepository.toStatus(row);

        assertThat(status.status()).isEqualTo("budget_exhausted");
        assertThat(status.updatedAt()).isEqualTo(1786841273L);
        assertThat(status.lastSuccessAt()).isEqualTo(1786841270L);
        assertThat(status.resumesAt()).isEqualTo(1786860000L);
    }

    // Первый запуск: успеха ещё не было, пауза бессрочная — оба поля null, не 0.
    @Test
    void mapsHeartbeatWithoutSuccessOrResumeTime() throws Exception {
        JsonNode row = objectMapper.readTree("""
                {
                  "service": "ingest", "status": "opensky_unreachable",
                  "updated_at": 1786841273, "last_success_at": null,
                  "resumes_at": null, "credits_remaining": 4000
                }
                """);

        PipelineStatus status = YtPipelineStatusRepository.toStatus(row);

        assertThat(status.lastSuccessAt()).isNull();
        assertThat(status.resumesAt()).isNull();
    }
}
