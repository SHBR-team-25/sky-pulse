package com.skypulse.positions.repository;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skypulse.positions.api.dto.BoundingBox;
import com.skypulse.positions.model.Position;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Repository;
import org.springframework.web.client.RestClient;

/**
 * Читает positions_current/positions_history из YTsaurus через HTTP-прокси
 * (select_rows), а не через RPC-клиент tech.ytsaurus:ytsaurus-client — так
 * не нужна ни новая Maven-зависимость, ни DNS-хак для RPC-proxy, а сервис
 * из docker-compose.yml бьёт напрямую в http-proxy по обычному DNS.
 */
@Repository
@Profile("yt")
public class YtPositionRepository implements PositionRepository {

    // ICAO24 — всегда 6 hex-символов; заодно защищает от инъекции в QL-строку select_rows.
    private static final Pattern ICAO24_PATTERN = Pattern.compile("^[0-9a-fA-F]{6}$");

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final String token;
    private final String positionsCurrentPath;
    private final String positionsHistoryPath;
    private final long maxPositionAgeSeconds;
    private final int maxCurrentPositions;

    public YtPositionRepository(
            RestClient.Builder restClientBuilder,
            ObjectMapper objectMapper,
            @Value("${skypulse.yt.proxy}") String proxy,
            @Value("${skypulse.yt.token}") String token,
            @Value("${skypulse.yt.positions-current-path}") String positionsCurrentPath,
            @Value("${skypulse.yt.positions-history-path}") String positionsHistoryPath,
            @Value("${skypulse.yt.max-position-age-seconds}") long maxPositionAgeSeconds,
            @Value("${skypulse.yt.max-current-positions}") int maxCurrentPositions) {
        this.restClient = restClientBuilder.baseUrl(normalizeProxyUrl(proxy)).build();
        this.objectMapper = objectMapper;
        this.token = token;
        this.positionsCurrentPath = positionsCurrentPath;
        this.positionsHistoryPath = positionsHistoryPath;
        this.maxPositionAgeSeconds = maxPositionAgeSeconds;
        this.maxCurrentPositions = maxCurrentPositions;
    }

    @Override
    public List<Position> currentPositions(BoundingBox area) {
        long freshnessThreshold = Instant.now().getEpochSecond() - maxPositionAgeSeconds;
        // Пайплайн опрашивает весь мир, поэтому запрос без bbox надо ограничивать.
        String query = "* from [%s]%s limit %d"
                .formatted(positionsCurrentPath, whereClause(area, freshnessThreshold), maxCurrentPositions);
        return selectRows(query).stream().map(YtPositionRepository::toPosition).toList();
    }

    @Override
    public Optional<Position> latestByIcao24(String icao24) {
        if (!isValidIcao24(icao24)) {
            return Optional.empty();
        }
        String query = "* from [%s] where icao24 = '%s' limit 1"
                .formatted(positionsCurrentPath, icao24.toLowerCase(Locale.ROOT));
        return selectRows(query).stream().map(YtPositionRepository::toPosition).findFirst();
    }

    @Override
    public List<Position> historyByIcao24(String icao24, long sinceSeconds) {
        if (!isValidIcao24(icao24)) {
            return List.of();
        }
        // positions_history отсортирована по (icao24, time_position) — при таком фильтре
        // select_rows физически отдаёт строки уже в хронологическом порядке.
        long threshold = Instant.now().getEpochSecond() - sinceSeconds;
        String query = "* from [%s] where icao24 = '%s' and time_position >= %d"
                .formatted(positionsHistoryPath, icao24.toLowerCase(Locale.ROOT), threshold);
        return selectRows(query).stream().map(YtPositionRepository::toPosition).toList();
    }

    private List<JsonNode> selectRows(String query) {
        String body = restClient.get()
                .uri(uriBuilder -> uriBuilder.path("/api/v4/select_rows").queryParam("query", query).build())
                .header(HttpHeaders.AUTHORIZATION, "OAuth " + token)
                .header(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .retrieve()
                .body(String.class);
        return parseNdjson(body);
    }

    // select_rows с Accept: application/json отдаёт NDJSON (объект на строку), не JSON-массив.
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

    static boolean isValidIcao24(String icao24) {
        return icao24 != null && ICAO24_PATTERN.matcher(icao24).matches();
    }

    static String whereClause(BoundingBox area, long freshnessThreshold) {
        // Джоба апсертит positions_current по icao24 и никогда не удаляет строки,
        // поэтому без отсечки по времени на карте зависают севшие борта.
        String freshness = "time_position >= %d".formatted(freshnessThreshold);
        if (area == null) {
            return " where " + freshness;
        }
        return " where %s and lat between %s and %s and lon between %s and %s"
                .formatted(freshness, area.minLat(), area.maxLat(), area.minLon(), area.maxLon());
    }

    static String normalizeProxyUrl(String proxy) {
        return proxy.startsWith("http://") || proxy.startsWith("https://") ? proxy : "https://" + proxy;
    }

    static Position toPosition(JsonNode row) {
        return new Position(
                row.path("icao24").asText(),
                row.path("callsign").asText(null),
                row.path("origin_country").asText(null),
                row.path("time_position").asLong(),
                row.path("lat").asDouble(),
                row.path("lon").asDouble(),
                nullableDouble(row, "baro_altitude"),
                row.path("on_ground").asBoolean(),
                nullableDouble(row, "velocity"),
                nullableDouble(row, "true_track"),
                row.path("manufacturername").asText(null),
                row.path("model").asText(null),
                row.path("operator").asText(null)
        );
    }

    private static Double nullableDouble(JsonNode row, String field) {
        JsonNode value = row.get(field);
        return value == null || value.isNull() ? null : value.asDouble();
    }
}
