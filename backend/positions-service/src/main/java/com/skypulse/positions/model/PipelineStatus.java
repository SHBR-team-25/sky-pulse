package com.skypulse.positions.model;

public record PipelineStatus(
        String status,
        Long lastSuccessAt,
        Long resumesAt
) {

    public static PipelineStatus unknown() {
        return new PipelineStatus("unknown", null, null);
    }
}
