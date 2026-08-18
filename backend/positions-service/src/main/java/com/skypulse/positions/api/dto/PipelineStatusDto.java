package com.skypulse.positions.api.dto;

import com.skypulse.positions.model.PipelineHealth;

public record PipelineStatusDto(
        String status,
        Long lastSuccessAt,
        Long resumesAt,
        boolean stale
) {

    public static PipelineStatusDto from(PipelineHealth health) {
        return new PipelineStatusDto(
                health.status().status(),
                health.status().lastSuccessAt(),
                health.status().resumesAt(),
                health.stale());
    }
}
