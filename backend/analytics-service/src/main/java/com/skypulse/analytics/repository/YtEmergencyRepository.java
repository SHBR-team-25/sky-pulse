package com.skypulse.analytics.repository;

import com.fasterxml.jackson.databind.JsonNode;
import com.skypulse.analytics.model.EmergencyFlight;
import java.time.Instant;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;

@Repository
public class YtEmergencyRepository implements EmergencyRepository {

    private static final Logger LOG = LoggerFactory.getLogger(YtEmergencyRepository.class);

    // 7500 — захват судна, 7700 — общая аварийная ситуация.
    private static final String EMERGENCY_SQUAWKS = "'7500', '7700'";

    private final YtQueryClient ytQueryClient;
    private final String positionsCurrentPath;

    public YtEmergencyRepository(
            YtQueryClient ytQueryClient,
            @Value("${skypulse.yt.positions-current-path}") String positionsCurrentPath) {
        this.ytQueryClient = ytQueryClient;
        this.positionsCurrentPath = positionsCurrentPath;
    }

    @Override
    public List<EmergencyFlight> current(long maxPositionAgeSeconds) {
        // positions_current хранит последнюю позицию борта вечно, и без отсечки
        // по свежести вчерашний сигнал бедствия навсегда останется «текущим».
        long since = Instant.now().getEpochSecond() - maxPositionAgeSeconds;
        String query = """
                icao24, callsign, squawk, lat, lon, on_ground, time_position from [%s] \
                where squawk in (%s) and time_position >= %d"""
                .formatted(positionsCurrentPath, EMERGENCY_SQUAWKS, since);
        return YtRow.mapSkippingBroken(ytQueryClient.selectRows(query), YtEmergencyRepository::toFlight, LOG);
    }

    static EmergencyFlight toFlight(JsonNode row) {
        return new EmergencyFlight(
                YtRow.requiredText(row, "icao24"),
                YtRow.text(row, "callsign"),
                YtRow.requiredText(row, "squawk"),
                YtRow.requiredDouble(row, "lat"),
                YtRow.requiredDouble(row, "lon"),
                YtRow.flag(row, "on_ground"),
                YtRow.requiredLong(row, "time_position"));
    }
}
