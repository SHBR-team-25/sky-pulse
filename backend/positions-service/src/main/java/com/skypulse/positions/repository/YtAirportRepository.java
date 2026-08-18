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

    // Через сколько пробовать снова, если перечитать таблицу не удалось.
    // Без паузы каждый запрос клиента ломился бы в упавший YT заново.
    private static final long RETRY_AFTER_FAILURE_SECONDS = 60L;

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
        if (isFresh(cached)) {
            return cached.directory();
        }
        // synchronized, чтобы параллельные запросы не запустили несколько чтений таблицы одновременно.
        synchronized (this) {
            CachedDirectory current = cache.get();
            return isFresh(current) ? current.directory() : reload(current);
        }
    }

    private static boolean isFresh(CachedDirectory cached) {
        return cached != null && Instant.now().getEpochSecond() < cached.expiresAt();
    }

    private AirportDirectory reload(CachedDirectory stale) {
        long now = Instant.now().getEpochSecond();
        try {
            AirportDirectory loaded = load();
            cache.set(new CachedDirectory(loaded, now + cacheTtlSeconds));
            return loaded;
        } catch (DataSourceUnavailableException | DataSourceRejectedException e) {
            if (stale == null) {
                throw e;
            }
            // Справочник статический и устаревает месяцами: вчерашний снапшот
            // клиенту полезнее, чем 503 на всю ручку из-за минутной недоступности YT.
            LOG.warn("Справочник аэропортов не перечитан, отдаём прежний снапшот", e);
            cache.set(new CachedDirectory(stale.directory(), now + RETRY_AFTER_FAILURE_SECONDS));
            return stale.directory();
        }
    }

    private AirportDirectory load() {
        long startedAt = System.currentTimeMillis();
        var airports = YtRow.mapSkippingBroken(
                ytQueryClient.readTable(refAirportsPath), YtAirportRepository::toAirport, LOG);
        LOG.info("Прочитан справочник аэропортов: {} строк за {} мс", airports.size(),
                System.currentTimeMillis() - startedAt);
        return new AirportDirectory(airports, modificationTime());
    }

    // null, а не 0: нулём клиент отрисует «справочник от 1 января 1970 года».
    private Long modificationTime() {
        String raw = ytQueryClient.getAttribute(refAirportsPath, "modification_time").asText(null);
        if (raw == null) {
            return null;
        }
        try {
            return Instant.parse(raw).getEpochSecond();
        } catch (DateTimeParseException e) {
            LOG.warn("Не разобрано modification_time таблицы {}: {}", refAirportsPath, raw);
            return null;
        }
    }

    static Airport toAirport(JsonNode row) {
        try {
            String icaoCode = YtRow.text(row, "icao_code");
            return new Airport(
                    icaoCode != null ? icaoCode : YtRow.requiredText(row, "ident"),
                    YtRow.text(row, "iata_code"),
                    // Без названия аэропорт нечего показать и не с чем сравнить при сортировке.
                    YtRow.requiredText(row, "name"),
                    YtRow.text(row, "type"),
                    YtRow.text(row, "municipality"),
                    YtRow.text(row, "iso_country"),
                    YtRow.requiredDouble(row, "latitude_deg"),
                    YtRow.requiredDouble(row, "longitude_deg")
            );
        } catch (IllegalArgumentException e) {
            throw new MalformedRowException(e.getMessage(), e);
        }
    }

    private record CachedDirectory(AirportDirectory directory, long expiresAt) {
    }
}
