package com.skypulse.positions.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.skypulse.positions.model.PipelineHealth;
import com.skypulse.positions.model.PipelineStatus;
import com.skypulse.positions.repository.PipelineStatusRepository;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class PipelineStatusServiceTest {

    private static final long STALE_AFTER_SECONDS = 120L;

    private static PipelineStatusService serviceReturning(PipelineStatus status) {
        PipelineStatusRepository repository = () -> Optional.ofNullable(status);
        return new PipelineStatusService(repository, STALE_AFTER_SECONDS);
    }

    @Test
    void freshHeartbeatIsNotStale() {
        long now = Instant.now().getEpochSecond();

        PipelineHealth health = serviceReturning(new PipelineStatus("ok", now, null)).current();

        assertThat(health.status().status()).isEqualTo("ok");
        assertThat(health.stale()).isFalse();
        assertThat(health.status().resumesAt()).isNull();
    }

    @Test
    void heartbeatOlderThanThresholdIsStale() {
        long longAgo = Instant.now().getEpochSecond() - STALE_AFTER_SECONDS - 1;

        PipelineHealth health = serviceReturning(new PipelineStatus("ok", longAgo, null)).current();

        assertThat(health.stale()).isTrue();
    }

    // Ingest ни разу не отработал — молча показывать пустую карту нельзя.
    @Test
    void missingHeartbeatIsReportedAsUnknownAndStale() {
        PipelineHealth health = serviceReturning(null).current();

        assertThat(health.status().status()).isEqualTo("unknown");
        assertThat(health.stale()).isTrue();
        assertThat(health.status().lastSuccessAt()).isNull();
    }

    // Джоб зарегистрировался, но ещё ничего не обработал.
    @Test
    void heartbeatWithoutAnySuccessIsStale() {
        PipelineHealth health = serviceReturning(new PipelineStatus("ok", null, null)).current();

        assertThat(health.stale()).isTrue();
        assertThat(health.status().lastSuccessAt()).isNull();
    }
}
