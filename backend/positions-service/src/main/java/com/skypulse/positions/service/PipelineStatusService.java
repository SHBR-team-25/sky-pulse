package com.skypulse.positions.service;

import com.skypulse.positions.api.dto.PipelineStatusDto;
import com.skypulse.positions.model.PipelineStatus;
import com.skypulse.positions.repository.PipelineStatusRepository;
import java.time.Instant;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class PipelineStatusService {

    private final PipelineStatusRepository repository;
    private final long staleAfterSeconds;

    public PipelineStatusService(
            PipelineStatusRepository repository,
            @Value("${skypulse.pipeline.stale-after-seconds}") long staleAfterSeconds) {
        this.repository = repository;
        this.staleAfterSeconds = staleAfterSeconds;
    }

    public PipelineStatusDto current() {
        PipelineStatus status = repository.latest().orElseGet(PipelineStatus::unknown);
        return new PipelineStatusDto(
                status.status(),
                status.lastSuccessAt(),
                status.resumesAt(),
                isStale(status));
    }

    // Пустой список бортов неотличим от честно пустого bbox, поэтому «данные
    // не обновляются» приходится сообщать отдельным флагом.
    private boolean isStale(PipelineStatus status) {
        if (status.lastSuccessAt() == null) {
            return true;
        }
        return Instant.now().getEpochSecond() - status.lastSuccessAt() > staleAfterSeconds;
    }
}
