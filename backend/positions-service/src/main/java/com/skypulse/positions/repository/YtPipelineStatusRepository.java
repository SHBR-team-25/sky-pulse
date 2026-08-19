package com.skypulse.positions.repository;

import com.fasterxml.jackson.databind.JsonNode;
import com.skypulse.positions.model.PipelineStatus;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;

/**
 * В `pipeline_job_state` есть только watermark'и джобов: ни статуса, ни причины паузы,
 * ни времени возобновления, поэтому наружу отдаётся только «докуда доведены данные».
 */
@Repository
public class YtPipelineStatusRepository implements PipelineStatusRepository {

    private static final String STATUS_REPORTING = "ok";

    private final YtQueryClient ytQueryClient;
    private final String jobStatePath;

    public YtPipelineStatusRepository(
            YtQueryClient ytQueryClient,
            @Value("${skypulse.yt.pipeline-job-state-path}") String jobStatePath) {
        this.ytQueryClient = ytQueryClient;
        this.jobStatePath = jobStatePath;
    }

    @Override
    public Optional<PipelineStatus> latest() {
        return latestOf(ytQueryClient.selectRows("* from [%s]".formatted(jobStatePath)));
    }

    // В таблице по строке на джоб; про пайплайн в целом говорит последний отчитавшийся.
    static Optional<PipelineStatus> latestOf(List<JsonNode> rows) {
        return rows.stream()
                .max(Comparator.comparingLong(row -> row.path("updated_at").asLong()))
                .map(YtPipelineStatusRepository::toStatus);
    }

    static PipelineStatus toStatus(JsonNode row) {
        // Свежесть — по watermark_ts: updated_at растёт даже когда данные стоят.
        return new PipelineStatus(
                STATUS_REPORTING,
                YtRow.nullableLong(row, "watermark_ts"),
                null
        );
    }
}
