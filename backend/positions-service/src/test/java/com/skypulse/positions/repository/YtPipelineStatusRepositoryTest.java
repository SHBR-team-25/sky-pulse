package com.skypulse.positions.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skypulse.positions.model.PipelineStatus;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class YtPipelineStatusRepositoryTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    private JsonNode row(String json) throws Exception {
        return objectMapper.readTree(json);
    }

    @Test
    void reportsWatermarkAsLastSuccess() throws Exception {
        PipelineStatus status = YtPipelineStatusRepository.toStatus(
                row("""
                        {"job_name": "job_segment", "watermark_ts": 1787055847, "updated_at": 1787055889}
                        """));

        assertThat(status.status()).isEqualTo("ok");
        assertThat(status.lastSuccessAt()).isEqualTo(1787055847L);
        // Причин паузы таблица не хранит, обещать время возобновления нечем.
        assertThat(status.resumesAt()).isNull();
    }

    // Джоб зарегистрировался, но ещё ничего не обработал: 0 здесь означал бы
    // «данные доехали до 1970 года», а не «данных нет».
    @Test
    void mapsMissingWatermarkToNull() throws Exception {
        PipelineStatus status = YtPipelineStatusRepository.toStatus(
                row("""
                        {"job_name": "job_segment", "watermark_ts": null, "updated_at": 1787055889}
                        """));

        assertThat(status.lastSuccessAt()).isNull();
    }

    @Test
    void picksJobThatReportedLast() throws Exception {
        List<JsonNode> rows = List.of(
                row("""
                        {"job_name": "job_segment", "watermark_ts": 1787000000, "updated_at": 1787000100}
                        """),
                row("""
                        {"job_name": "job_ingest", "watermark_ts": 1787055847, "updated_at": 1787055889}
                        """));

        Optional<PipelineStatus> status = YtPipelineStatusRepository.latestOf(rows);

        assertThat(status).isPresent();
        assertThat(status.get().lastSuccessAt()).isEqualTo(1787055847L);
    }

    // Таблицу пересоздают на ходу, и тогда она пустая — это не ошибка,
    // а «состояние неизвестно».
    @Test
    void emptyTableGivesNoStatus() {
        assertThat(YtPipelineStatusRepository.latestOf(List.of())).isEmpty();
    }
}
