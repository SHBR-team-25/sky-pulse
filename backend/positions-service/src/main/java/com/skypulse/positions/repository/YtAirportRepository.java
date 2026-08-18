package com.skypulse.positions.repository;

import com.fasterxml.jackson.databind.JsonNode;
import com.skypulse.positions.model.Airport;
import com.skypulse.positions.model.AirportDirectory;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.concurrent.atomic.AtomicReference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;

/**
 * Держит ref_airports целиком в памяти.
 */
@Repository
public class YtAirportRepository implements AirportRepository {

    private static final Logger LOG = LoggerFactory.getLogger(YtAirportRepository.class);

    private final YtQueryClient ytQueryClient;
    private final String refAirportsPath;
    private final long cacheTtlSeconds;
    private final AtomicReference<CachedDirectory> cache = new AtomicReference<>();

    public YtAirportRepository(
            YtQueryClient ytQueryClient,
            @Value("${skypulse.yt.ref-airports-path}") String refAirportsPath,
            @Value("${skypulse.yt.ref-airports-cache-ttl-seconds}") long cacheTtlSeconds) {
        this.ytQueryClient = ytQueryClient;
        this.refAirportsPath = refAirportsPath;
        this.cacheTtlSeconds = cacheTtlSeconds;
    }

    @Override
    public AirportDirectory directory() {
        CachedDirectory cached = cache.get();
        long now = Instant.now().getEpochSecond();
        if (cached != null && now - cached.loadedAt() < cacheTtlSeconds) {
            return cached.directory();
        }
        // synchronized, чтобы параллельные запросы не запустили несколько чтений таблицы одновременно.
        synchronized (this) {
            CachedDirectory current = cache.get();
            if (current != null && Instant.now().getEpochSecond() - current.loadedAt() < cacheTtlSeconds) {
                return current.directory();
            }
            AirportDirectory loaded = load();
            cache.set(new CachedDirectory(loaded, Instant.now().getEpochSecond()));
            return loaded;
        }
    }

    private AirportDirectory load() {
        long startedAt = System.currentTimeMillis();
        var airports = ytQueryClient.readTable(refAirportsPath).stream()
                .map(YtAirportRepository::toAirport)
                .toList();
        LOG.info("Прочитан справочник аэропортов: {} строк за {} мс", airports.size(),
                System.currentTimeMillis() - startedAt);
        return new AirportDirectory(airports, modificationTime());
    }

    private long modificationTime() {
        String raw = ytQueryClient.getAttribute(refAirportsPath, "modification_time").asText(null);
        try {
            return raw == null ? 0L : Instant.parse(raw).getEpochSecond();
        } catch (DateTimeParseException e) {
            LOG.warn("Не разобрано modification_time таблицы {}: {}", refAirportsPath, raw);
            return 0L;
        }
    }

    static Airport toAirport(JsonNode row) {
        String icaoCode = text(row, "icao_code");
        return new Airport(
                icaoCode != null ? icaoCode : text(row, "ident"),
                text(row, "iata_code"),
                text(row, "name"),
                text(row, "type"),
                text(row, "municipality"),
                text(row, "iso_country"),
                row.path("latitude_deg").asDouble(),
                row.path("longitude_deg").asDouble()
        );
    }

    private static String text(JsonNode row, String field) {
        JsonNode value = row.get(field);
        if (value == null || value.isNull()) {
            return null;
        }
        String asText = value.asText();
        return asText.isBlank() ? null : asText;
    }

    private record CachedDirectory(AirportDirectory directory, long loadedAt) {
    }
}
