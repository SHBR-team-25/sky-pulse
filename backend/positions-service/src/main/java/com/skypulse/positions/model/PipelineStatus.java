package com.skypulse.positions.model;

public record PipelineStatus(
        String status,
        long updatedAt,
        Long lastSuccessAt,
        Long resumesAt
) {

    // Хартбита нет вовсе: ingest ни разу не запускался или таблицу не создали.
    public static PipelineStatus unknown() {
        return new PipelineStatus("unknown", 0L, null, null);
    }
}
