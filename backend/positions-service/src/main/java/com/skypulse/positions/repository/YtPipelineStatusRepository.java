package com.skypulse.positions.repository;

import com.fasterxml.jackson.databind.JsonNode;
import com.skypulse.positions.model.PipelineStatus;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;

/**
 * Единственный след пайплайна в YT — `pipeline_job_state`, таблица watermark'ов
 * джобов: `(job_name, watermark_ts, updated_at)`. Ни статуса, ни причины паузы,
 * ни времени возобновления в ней нет, поэтому наружу отдаётся только факт
 * «пайплайн отчитывался и довёл данные до такого-то момента».
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

    // В таблице по строке на джоб; про пайплайн в целом говорит тот,
    // кто отчитался последним.
    static Optional<PipelineStatus> latestOf(List<JsonNode> rows) {
        return rows.stream()
                .max(Comparator.comparingLong(row -> row.path("updated_at").asLong()))
                .map(YtPipelineStatusRepository::toStatus);
    }

    static PipelineStatus toStatus(JsonNode row) {
        // Свежесть данных считаем по watermark_ts, а не по updated_at: если джоб
        // крутится, а источник умер, updated_at продолжает расти, и по нему
        // пайплайн выглядел бы живым при стоящих данных.
        return new PipelineStatus(
                STATUS_REPORTING,
                row.path("updated_at").asLong(),
                nullableLong(row, "watermark_ts"),
                null
        );
    }

    private static Long nullableLong(JsonNode row, String field) {
        JsonNode value = row.get(field);
        return value == null || value.isNull() ? null : value.asLong();
    }
}
