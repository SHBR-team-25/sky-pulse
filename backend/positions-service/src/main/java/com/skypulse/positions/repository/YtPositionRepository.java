package com.skypulse.positions.repository;

import com.fasterxml.jackson.databind.JsonNode;
import com.skypulse.positions.api.dto.BoundingBox;
import com.skypulse.positions.model.Position;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;

@Repository
public class YtPositionRepository implements PositionRepository {

    // Заодно защищает от инъекции в QL-строку select_rows.
    private static final Pattern ICAO24_PATTERN = Pattern.compile("^[0-9a-fA-F]{6}$");

    private final YtQueryClient ytQueryClient;
    private final String positionsCurrentPath;
    private final String positionsHistoryPath;
    private final long maxPositionAgeSeconds;

    public YtPositionRepository(
            YtQueryClient ytQueryClient,
            @Value("${skypulse.yt.positions-current-path}") String positionsCurrentPath,
            @Value("${skypulse.yt.positions-history-path}") String positionsHistoryPath,
            @Value("${skypulse.yt.max-position-age-seconds}") long maxPositionAgeSeconds) {
        this.ytQueryClient = ytQueryClient;
        this.positionsCurrentPath = positionsCurrentPath;
        this.positionsHistoryPath = positionsHistoryPath;
        this.maxPositionAgeSeconds = maxPositionAgeSeconds;
    }

    @Override
    public List<Position> currentPositions(BoundingBox area) {
        long freshnessThreshold = Instant.now().getEpochSecond() - maxPositionAgeSeconds;
        String query = "* from [%s]%s"
                .formatted(positionsCurrentPath, whereClause(area, freshnessThreshold));
        return ytQueryClient.selectRows(query).stream().map(YtPositionRepository::toPosition).toList();
    }

    @Override
    public Optional<Position> latestByIcao24(String icao24) {
        if (!isValidIcao24(icao24)) {
            return Optional.empty();
        }
        String query = "* from [%s] where icao24 = '%s' limit 1"
                .formatted(positionsCurrentPath, icao24.toLowerCase(Locale.ROOT));
        return ytQueryClient.selectRows(query).stream().map(YtPositionRepository::toPosition).findFirst();
    }

    @Override
    public List<Position> historyByIcao24(String icao24, long sinceSeconds) {
        if (!isValidIcao24(icao24)) {
            return List.of();
        }
        // Таблица отсортирована по (icao24, time_position), так что строки придут
        // уже в хронологическом порядке.
        long threshold = Instant.now().getEpochSecond() - sinceSeconds;
        String query = "* from [%s] where icao24 = '%s' and time_position >= %d"
                .formatted(positionsHistoryPath, icao24.toLowerCase(Locale.ROOT), threshold);
        return ytQueryClient.selectRows(query).stream().map(YtPositionRepository::toPosition).toList();
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
                .formatted(freshness, area.latMin(), area.latMax(), area.lonMin(), area.lonMax());
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
