package com.skypulse.positions.repository;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import java.util.List;
import java.util.function.Supplier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.ClientHttpRequestFactories;
import org.springframework.boot.web.client.ClientHttpRequestFactorySettings;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * Ходит в YTsaurus через HTTP-прокси, а не через RPC-клиент
 * tech.ytsaurus:ytsaurus-client — так не нужен DNS-хак для RPC-proxy.
 */
@Component
public class YtQueryClient {

    // При поломке источника вместо NDJSON приходит целая HTML-страница от прокси,
    // поэтому в сообщение об ошибке кладём только начало ответа.
    private static final int MAX_REPORTED_LENGTH = 200;

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final String token;

    public YtQueryClient(
            RestClient.Builder restClientBuilder,
            ObjectMapper objectMapper,
            @Value("${skypulse.yt.proxy}") String proxy,
            @Value("${skypulse.yt.token}") String token,
            @Value("${skypulse.yt.connect-timeout-seconds}") long connectTimeoutSeconds,
            @Value("${skypulse.yt.read-timeout-seconds}") long readTimeoutSeconds) {
        var timeouts = ClientHttpRequestFactorySettings.DEFAULTS
                .withConnectTimeout(Duration.ofSeconds(connectTimeoutSeconds))
                .withReadTimeout(Duration.ofSeconds(readTimeoutSeconds));
        this.restClient = restClientBuilder
                .baseUrl(normalizeProxyUrl(proxy))
                .requestFactory(ClientHttpRequestFactories.get(timeouts))
                .build();
        this.objectMapper = objectMapper;
        this.token = token;
    }

    public List<JsonNode> selectRows(String query) {
        return parseNdjson(execute("select_rows", () -> restClient.get()
                .uri(uriBuilder -> uriBuilder.path("/api/v4/select_rows").queryParam("query", query).build())
                .header(HttpHeaders.AUTHORIZATION, "OAuth " + token)
                .header(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .retrieve()
                .body(String.class)));
    }

    /**
     * Читает статическую таблицу целиком: `select_rows` умеет только динамические
     * таблицы и на `ref_airports` отвечает «Table ... is not dynamic».
     */
    public List<JsonNode> readTable(String path) {
        return parseNdjson(execute("read_table " + path, () -> restClient.get()
                .uri(uriBuilder -> uriBuilder.path("/api/v4/read_table")
                        .queryParam("path", path)
                        .queryParam("output_format", "json")
                        .build())
                .header(HttpHeaders.AUTHORIZATION, "OAuth " + token)
                .retrieve()
                .body(String.class)));
    }

    /** Значение атрибута узла Кипариса, например `modification_time`. */
    public JsonNode getAttribute(String path, String attribute) {
        String body = execute("get " + path + "/@" + attribute, () -> restClient.get()
                .uri(uriBuilder -> uriBuilder.path("/api/v4/get")
                        .queryParam("path", path + "/@" + attribute)
                        .build())
                .header(HttpHeaders.AUTHORIZATION, "OAuth " + token)
                .header(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .retrieve()
                .body(String.class));
        return readTree(body == null ? "{}" : body).path("value");
    }

    private String execute(String operation, Supplier<String> call) {
        try {
            return call.get();
        } catch (HttpClientErrorException e) {
            throw new DataSourceRejectedException(operation, e.getStatusCode().value(), e);
        } catch (RestClientException e) {
            throw new DataSourceUnavailableException("Запрос %s в YTsaurus не удался".formatted(operation), e);
        }
    }

    // select_rows и read_table с Accept: application/json отдают NDJSON, а не JSON-массив.
    private List<JsonNode> parseNdjson(String body) {
        if (body == null || body.isBlank()) {
            return List.of();
        }
        return body.lines()
                .filter(line -> !line.isBlank())
                .map(this::readTree)
                .toList();
    }

    private JsonNode readTree(String line) {
        try {
            return objectMapper.readTree(line);
        } catch (JsonProcessingException e) {
            // Не 500: сервис исправен, негодный ответ пришёл от источника.
            throw new DataSourceUnavailableException(
                    "YTsaurus вернул неразбираемый ответ: " + shorten(line), e);
        }
    }

    private static String shorten(String line) {
        return line.length() <= MAX_REPORTED_LENGTH ? line : line.substring(0, MAX_REPORTED_LENGTH) + "…";
    }

    static String normalizeProxyUrl(String proxy) {
        return proxy.startsWith("http://") || proxy.startsWith("https://") ? proxy : "https://" + proxy;
    }
}
