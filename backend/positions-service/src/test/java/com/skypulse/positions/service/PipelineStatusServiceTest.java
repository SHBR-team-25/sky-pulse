package com.skypulse.positions.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.skypulse.positions.api.dto.PipelineStatusDto;
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

        PipelineStatusDto dto = serviceReturning(new PipelineStatus("ok", now, now, null)).current();

        assertThat(dto.status()).isEqualTo("ok");
        assertThat(dto.stale()).isFalse();
        assertThat(dto.resumesAt()).isNull();
    }

    @Test
    void heartbeatOlderThanThresholdIsStale() {
        long longAgo = Instant.now().getEpochSecond() - STALE_AFTER_SECONDS - 1;

        PipelineStatusDto dto = serviceReturning(new PipelineStatus("ok", longAgo, longAgo, null)).current();

        assertThat(dto.stale()).isTrue();
    }

    // Пауза стоп-крана штатно длится часы — фронту нужно и то, что данные стухли,
    // и время возобновления, чтобы написать «до 00:00 UTC», а не просто «ошибка».
    @Test
    void exhaustedBudgetReportsWhenPollingResumes() {
        long lastSuccess = Instant.now().getEpochSecond() - 3600;
        long resumesAt = Instant.now().getEpochSecond() + 7200;

        PipelineStatusDto dto = serviceReturning(
                new PipelineStatus("budget_exhausted", lastSuccess, lastSuccess, resumesAt)).current();

        assertThat(dto.status()).isEqualTo("budget_exhausted");
        assertThat(dto.stale()).isTrue();
        assertThat(dto.resumesAt()).isEqualTo(resumesAt);
    }

    // Ingest ни разу не отработал — молча показывать пустую карту нельзя.
    @Test
    void missingHeartbeatIsReportedAsUnknownAndStale() {
        PipelineStatusDto dto = serviceReturning(null).current();

        assertThat(dto.status()).isEqualTo("unknown");
        assertThat(dto.stale()).isTrue();
        assertThat(dto.lastSuccessAt()).isNull();
    }

    @Test
    void heartbeatWithoutAnySuccessIsStale() {
        long now = Instant.now().getEpochSecond();

        PipelineStatusDto dto = serviceReturning(
                new PipelineStatus("opensky_unreachable", now, null, now + 60)).current();

        assertThat(dto.stale()).isTrue();
    }
}
