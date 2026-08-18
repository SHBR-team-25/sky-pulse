package com.skypulse.positions.repository;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/**
 * Ходит в YTsaurus через HTTP-прокси, а не через RPC-клиент
 * tech.ytsaurus:ytsaurus-client — так не нужен DNS-хак для RPC-proxy.
 */
@Component
public class YtQueryClient {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final String token;

    public YtQueryClient(
            RestClient.Builder restClientBuilder,
            ObjectMapper objectMapper,
            @Value("${skypulse.yt.proxy}") String proxy,
            @Value("${skypulse.yt.token}") String token) {
        this.restClient = restClientBuilder.baseUrl(normalizeProxyUrl(proxy)).build();
        this.objectMapper = objectMapper;
        this.token = token;
    }

    public List<JsonNode> selectRows(String query) {
        String body = restClient.get()
                .uri(uriBuilder -> uriBuilder.path("/api/v4/select_rows").queryParam("query", query).build())
                .header(HttpHeaders.AUTHORIZATION, "OAuth " + token)
                .header(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .retrieve()
                .body(String.class);
        return parseNdjson(body);
    }

    /**
     * Читает статическую таблицу целиком: `select_rows` умеет только динамические
     * таблицы и на `ref_airports` отвечает «Table ... is not dynamic».
     */
    public List<JsonNode> readTable(String path) {
        String body = restClient.get()
                .uri(uriBuilder -> uriBuilder.path("/api/v4/read_table")
                        .queryParam("path", path)
                        .queryParam("output_format", "json")
                        .build())
                .header(HttpHeaders.AUTHORIZATION, "OAuth " + token)
                .retrieve()
                .body(String.class);
        return parseNdjson(body);
    }

    /** Значение атрибута узла Кипариса, например `modification_time`. */
    public JsonNode getAttribute(String path, String attribute) {
        String body = restClient.get()
                .uri(uriBuilder -> uriBuilder.path("/api/v4/get")
                        .queryParam("path", path + "/@" + attribute)
                        .build())
                .header(HttpHeaders.AUTHORIZATION, "OAuth " + token)
                .header(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .retrieve()
                .body(String.class);
        return readTree(body == null ? "{}" : body).path("value");
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
            throw new IllegalStateException("Не удалось разобрать строку ответа YT: " + line, e);
        }
    }

    static String normalizeProxyUrl(String proxy) {
        return proxy.startsWith("http://") || proxy.startsWith("https://") ? proxy : "https://" + proxy;
    }
}
