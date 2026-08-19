package com.skypulse.positions.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.skypulse.positions.repository.exception.DataSourceUnavailableException;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;

class YtQueryClientTest {

    private final YtQueryClient client =
            new YtQueryClient(RestClient.builder(), new ObjectMapper(), "localhost", "", 1L, 1L);

    @Test
    void normalizesProxyUrlWithMissingScheme() {
        assertThat(YtQueryClient.normalizeProxyUrl("http-proxy-hackathon.demo.ytsaurus.tech"))
                .isEqualTo("https://http-proxy-hackathon.demo.ytsaurus.tech");
        assertThat(YtQueryClient.normalizeProxyUrl("https://already-has-scheme.tech"))
                .isEqualTo("https://already-has-scheme.tech");
        assertThat(YtQueryClient.normalizeProxyUrl("http://localhost:8000"))
                .isEqualTo("http://localhost:8000");
    }

    @Test
    void readsRowsFromNdjsonAndIgnoresBlankLines() {
        var rows = client.parseNdjson("""
                {"icao24": "01023b"}

                {"icao24": "01025c"}
                """);

        assertThat(rows).hasSize(2);
        assertThat(rows.getFirst().path("icao24").asText()).isEqualTo("01023b");
    }

    @Test
    void treatsEmptyBodyAsNoRows() {
        assertThat(client.parseNdjson(null)).isEmpty();
        assertThat(client.parseNdjson("   ")).isEmpty();
    }

    // Упавший прокси отвечает HTML-страницей вместо NDJSON. Сервис при этом
    // исправен, поэтому наружу нужен отказ источника, а не 500.
    @Test
    void reportsUnparsableBodyAsSourceFailure() {
        assertThatThrownBy(() -> client.parseNdjson("<html>502 Bad Gateway</html>"))
                .isInstanceOf(DataSourceUnavailableException.class)
                .hasMessageContaining("502 Bad Gateway");
    }

    // Ответ целиком в сообщение исключения не помещаем: в лог уедет вся страница.
    @Test
    void shortensAnOverlongUnparsableBody() {
        String body = "<html>" + "x".repeat(5_000) + "</html>";

        assertThatThrownBy(() -> client.parseNdjson(body))
                .isInstanceOf(DataSourceUnavailableException.class)
                .satisfies(e -> assertThat(e.getMessage()).hasSizeLessThan(300).endsWith("…"));
    }
}
