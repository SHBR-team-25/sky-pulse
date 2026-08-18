package com.skypulse.positions.repository;

import com.fasterxml.jackson.databind.JsonNode;
import com.skypulse.positions.model.BoundingBox;
import com.skypulse.positions.model.Position;
import com.skypulse.positions.model.TrackPoint;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;

@Repository
public class YtPositionRepository implements PositionRepository {

    private static final Logger LOG = LoggerFactory.getLogger(YtPositionRepository.class);

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
        return positions(ytQueryClient.selectRows(query));
    }

    @Override
    public Optional<Position> latestByIcao24(String icao24) {
        if (!isValidIcao24(icao24)) {
            return Optional.empty();
        }
        String query = "* from [%s] where icao24 = '%s' limit 1"
                .formatted(positionsCurrentPath, icao24.toLowerCase(Locale.ROOT));
        // Строк здесь максимум одна, и негодная означает сломанный источник, а не «нет борта».
        return ytQueryClient.selectRows(query).stream().findFirst().map(YtPositionRepository::toPosition);
    }

    @Override
    public List<TrackPoint> historyByIcao24(String icao24, long sinceSeconds) {
        if (!isValidIcao24(icao24)) {
            return List.of();
        }
        // Таблица отсортирована по (icao24, time_position), так что строки придут
        // уже в хронологическом порядке.
        long threshold = Instant.now().getEpochSecond() - sinceSeconds;
        String query = "* from [%s] where icao24 = '%s' and time_position >= %d"
                .formatted(positionsHistoryPath, icao24.toLowerCase(Locale.ROOT), threshold);
        return YtRow.mapSkippingBroken(ytQueryClient.selectRows(query), YtPositionRepository::toTrackPoint, LOG);
    }

    static List<Position> positions(List<JsonNode> rows) {
        return YtRow.mapSkippingBroken(rows, YtPositionRepository::toPosition, LOG);
    }

    // Треку из positions_history нужны только координаты во времени: борт
    // и его модель клиент уже знает из карточки.
    static TrackPoint toTrackPoint(JsonNode row) {
        try {
            return new TrackPoint(
                    YtRow.requiredLong(row, "time_position"),
                    YtRow.requiredDouble(row, "lat"),
                    YtRow.requiredDouble(row, "lon"),
                    YtRow.nullableDouble(row, "baro_altitude")
            );
        } catch (IllegalArgumentException e) {
            throw new MalformedRowException(e.getMessage(), e);
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
                .formatted(freshness, area.latMin(), area.latMax(), area.lonMin(), area.lonMax());
    }

    static Position toPosition(JsonNode row) {
        try {
            return new Position(
                    YtRow.requiredText(row, "icao24"),
                    YtRow.text(row, "callsign"),
                    YtRow.text(row, "origin_country"),
                    YtRow.requiredLong(row, "time_position"),
                    YtRow.requiredDouble(row, "lat"),
                    YtRow.requiredDouble(row, "lon"),
                    YtRow.nullableDouble(row, "baro_altitude"),
                    YtRow.flag(row, "on_ground"),
                    YtRow.nullableDouble(row, "velocity"),
                    YtRow.nullableDouble(row, "true_track"),
                    YtRow.text(row, "manufacturername"),
                    YtRow.text(row, "model"),
                    YtRow.text(row, "operator")
            );
        } catch (IllegalArgumentException e) {
            throw new MalformedRowException(e.getMessage(), e);
        }
    }
}
