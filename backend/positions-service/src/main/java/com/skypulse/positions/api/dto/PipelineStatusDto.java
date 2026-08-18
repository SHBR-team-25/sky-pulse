package com.skypulse.positions.api.dto;

public record PipelineStatusDto(
        String status,
        Long lastSuccessAt,
        Long resumesAt,
        boolean stale
) {
}
