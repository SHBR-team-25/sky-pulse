package com.skypulse.analytics.repository;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skypulse.analytics.repository.exception.DataSourceRejectedException;
import com.skypulse.analytics.repository.exception.DataSourceUnavailableException;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.ClientHttpRequestFactories;
import org.springframework.boot.web.client.ClientHttpRequestFactorySettings;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/** Ходит в YTsaurus через HTTP-прокси: RPC-клиент потребовал бы DNS-хака. */
@Component
public class YtQueryClient {

    // На поломке прокси вместо NDJSON приходит целая HTML-страница.
    private static final int MAX_REPORTED_LENGTH = 200;

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final String baseUrl;
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
                .requestFactory(ClientHttpRequestFactories.get(timeouts))
                .build();
        this.objectMapper = objectMapper;
        this.baseUrl = normalizeProxyUrl(proxy);
        this.token = token;
    }

    public List<JsonNode> selectRows(String query) {
        return parseNdjson(execute("select_rows", () -> get(uri("select_rows", Map.of("query", query)))));
    }

    // Для статических таблиц: select_rows умеет только динамические.
    public List<JsonNode> readTable(String path) {
        var params = new LinkedHashMap<String, String>();
        params.put("path", path);
        params.put("output_format", "json");
        return parseNdjson(execute("read_table " + path, () -> get(uri("read_table", params))));
    }

    public JsonNode getAttribute(String path, String attribute) {
        String attributePath = path + "/@" + attribute;
        String body = execute("get " + attributePath, () -> get(uri("get", Map.of("path", attributePath))));
        return readTree(body == null ? "{}" : body).path("value");
    }

    private String get(URI uri) {
        return restClient.get()
                .uri(uri)
                .header(HttpHeaders.AUTHORIZATION, "OAuth " + token)
                .header(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .retrieve()
                .body(String.class);
    }

    private URI uri(String command, Map<String, String> params) {
        return URI.create(buildUrl(baseUrl, command, params));
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

    // YT отдаёт NDJSON, а не JSON-массив.
    List<JsonNode> parseNdjson(String body) {
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
            throw new DataSourceUnavailableException(
                    "YTsaurus вернул неразбираемый ответ: " + shorten(line), e);
        }
    }

    private static String shorten(String line) {
        return line.length() <= MAX_REPORTED_LENGTH ? line : line.substring(0, MAX_REPORTED_LENGTH) + "…";
    }

    /** Вручную, потому что UriBuilder принимает селектор колонок {@code {a,b}} за шаблон и падает. */
    static String buildUrl(String baseUrl, String command, Map<String, String> params) {
        String query = params.entrySet().stream()
                .map(param -> param.getKey() + "=" + URLEncoder.encode(param.getValue(), StandardCharsets.UTF_8))
                .collect(Collectors.joining("&"));
        return baseUrl + "/api/v4/" + command + "?" + query;
    }

    static String normalizeProxyUrl(String proxy) {
        String withScheme = proxy.startsWith("http://") || proxy.startsWith("https://") ? proxy : "https://" + proxy;
        return withScheme.endsWith("/") ? withScheme.substring(0, withScheme.length() - 1) : withScheme;
    }
}
