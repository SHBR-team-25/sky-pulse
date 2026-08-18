package com.skypulse.positions.model;

public record PipelineStatus(
        String status,
        long updatedAt,
        Long lastSuccessAt,
        Long resumesAt
) {

    // В pipeline_job_state нет ни одной строки: пайплайн ни разу не отчитывался
    // либо таблицу пересоздали.
    public static PipelineStatus unknown() {
        return new PipelineStatus("unknown", 0L, null, null);
    }
}
