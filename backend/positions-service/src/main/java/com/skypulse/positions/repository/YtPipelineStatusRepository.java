package com.skypulse.positions.repository;

import com.fasterxml.jackson.databind.JsonNode;
import com.skypulse.positions.model.PipelineStatus;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;

@Repository
public class YtPipelineStatusRepository implements PipelineStatusRepository {

    private static final String INGEST_SERVICE = "ingest";

    private final YtQueryClient ytQueryClient;
    private final String heartbeatPath;

    public YtPipelineStatusRepository(
            YtQueryClient ytQueryClient,
            @Value("${skypulse.yt.ingest-heartbeat-path}") String heartbeatPath) {
        this.ytQueryClient = ytQueryClient;
        this.heartbeatPath = heartbeatPath;
    }

    @Override
    public Optional<PipelineStatus> latest() {
        String query = "* from [%s] where service = '%s' limit 1".formatted(heartbeatPath, INGEST_SERVICE);
        return ytQueryClient.selectRows(query).stream().map(YtPipelineStatusRepository::toStatus).findFirst();
    }

    static PipelineStatus toStatus(JsonNode row) {
        return new PipelineStatus(
                row.path("status").asText("unknown"),
                row.path("updated_at").asLong(),
                nullableLong(row, "last_success_at"),
                nullableLong(row, "resumes_at")
        );
    }

    private static Long nullableLong(JsonNode row, String field) {
        JsonNode value = row.get(field);
        return value == null || value.isNull() ? null : value.asLong();
    }
}
