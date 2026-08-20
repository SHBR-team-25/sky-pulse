package com.skypulse.analytics.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.skypulse.analytics.repository.exception.DataSourceUnavailableException;
import java.util.LinkedHashMap;
import java.util.Map;
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
        // В .env прокси обычно записан со слэшем на конце, а путь уже начинается с него.
        assertThat(YtQueryClient.normalizeProxyUrl("https://proxy.tech/"))
                .isEqualTo("https://proxy.tech");
    }

    // Селектор колонок в пути таблицы — фигурные скобки, и UriBuilder принял бы
    // их за плейсхолдеры шаблона.
    @Test
    void keepsColumnSelectorInPath() {
        var params = new LinkedHashMap<String, String>();
        params.put("path", "//home/team/ref_airports{ident,name}");
        params.put("output_format", "json");

        assertThat(YtQueryClient.buildUrl("https://proxy.tech", "read_table", params))
                .isEqualTo("https://proxy.tech/api/v4/read_table"
                        + "?path=%2F%2Fhome%2Fteam%2Fref_airports%7Bident%2Cname%7D&output_format=json");
    }

    @Test
    void escapesQueryLanguageInSelectRows() {
        assertThat(YtQueryClient.buildUrl("https://proxy.tech", "select_rows",
                Map.of("query", "* from [//t] limit 1")))
                .isEqualTo("https://proxy.tech/api/v4/select_rows?query=*+from+%5B%2F%2Ft%5D+limit+1");
    }

    @Test
    void readsRowsFromNdjsonAndIgnoresBlankLines() {
        var rows = client.parseNdjson("""
                {"country": "Germany", "flight_count": 1035}

                {"country": "Turkey", "flight_count": 448}
                """);

        assertThat(rows).hasSize(2);
        assertThat(rows.getFirst().path("country").asText()).isEqualTo("Germany");
    }

    @Test
    void treatsEmptyBodyAsNoRows() {
        assertThat(client.parseNdjson(null)).isEmpty();
        assertThat(client.parseNdjson("   ")).isEmpty();
    }

    // Упавший прокси отвечает HTML-страницей вместо NDJSON. Сервис при этом
    // исправен, поэтому наружу нужен отказ источника, а не 500.
    @Test
    void reportsHtmlInsteadOfNdjsonAsSourceFailure() {
        assertThatThrownBy(() -> client.parseNdjson("<html><body>502 Bad Gateway</body></html>"))
                .isInstanceOf(DataSourceUnavailableException.class);
    }
}
