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

    // Пауза стоп-крана штатно длится часы — фронту нужно и то, что данные стухли,
    // и время возобновления, чтобы написать «до 00:00 UTC», а не просто «ошибка».
    @Test
    void exhaustedBudgetReportsWhenPollingResumes() {
        long lastSuccess = Instant.now().getEpochSecond() - 3600;
        long resumesAt = Instant.now().getEpochSecond() + 7200;

        PipelineHealth health = serviceReturning(
                new PipelineStatus("budget_exhausted", lastSuccess, resumesAt)).current();

        assertThat(health.status().status()).isEqualTo("budget_exhausted");
        assertThat(health.stale()).isTrue();
        assertThat(health.status().resumesAt()).isEqualTo(resumesAt);
    }

    // Ingest ни разу не отработал — молча показывать пустую карту нельзя.
    @Test
    void missingHeartbeatIsReportedAsUnknownAndStale() {
        PipelineHealth health = serviceReturning(null).current();

        assertThat(health.status().status()).isEqualTo("unknown");
        assertThat(health.stale()).isTrue();
        assertThat(health.status().lastSuccessAt()).isNull();
    }

    @Test
    void heartbeatWithoutAnySuccessIsStale() {
        long now = Instant.now().getEpochSecond();

        PipelineHealth health = serviceReturning(
                new PipelineStatus("opensky_unreachable", null, now + 60)).current();

        assertThat(health.stale()).isTrue();
    }
}
