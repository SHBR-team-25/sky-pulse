package com.skypulse.analytics.repository;

import com.fasterxml.jackson.databind.JsonNode;
import com.skypulse.analytics.model.AirportRef;
import com.skypulse.analytics.repository.exception.DataSourceRejectedException;
import com.skypulse.analytics.repository.exception.DataSourceUnavailableException;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;

/** Держит ref_airports в памяти: select_rows по статической таблице не работает. */
@Repository
public class YtAirportDirectory implements AirportDirectory {

    private static final Logger LOG = LoggerFactory.getLogger(YtAirportDirectory.class);

    // Из девяти колонок справочника дашборду нужны четыре, а строк там под 90 тысяч.
    private static final String COLUMNS = "{ident,icao_code,iata_code,name}";

    // Без паузы каждый запрос клиента ломился бы в упавший YT заново.
    private static final long RETRY_AFTER_FAILURE_SECONDS = 60L;

    private final YtQueryClient ytQueryClient;
    private final String refAirportsPath;
    private final long cacheTtlSeconds;
    private final AtomicReference<CachedNames> cache = new AtomicReference<>();

    public YtAirportDirectory(
            YtQueryClient ytQueryClient,
            @Value("${skypulse.yt.ref-airports-path}") String refAirportsPath,
            @Value("${skypulse.yt.ref-airports-cache-ttl-seconds}") long cacheTtlSeconds) {
        this.ytQueryClient = ytQueryClient;
        this.refAirportsPath = refAirportsPath;
        this.cacheTtlSeconds = cacheTtlSeconds;
    }

    @Override
    public AirportRef byIcao(String icao) {
        AirportRef known = names().get(icao);
        // Аэропорта нет в справочнике или справочник не прочитался — отдаём один
        // ICAO: терять из-за имени всю строку топа хуже, чем показать голый код.
        return known != null ? known : new AirportRef(icao, null, null);
    }

    private Map<String, AirportRef> names() {
        CachedNames cached = cache.get();
        if (isFresh(cached)) {
            return cached.names();
        }
        // Чтобы параллельные запросы не запустили несколько чтений таблицы разом.
        synchronized (this) {
            CachedNames current = cache.get();
            return isFresh(current) ? current.names() : reload(current);
        }
    }

    private static boolean isFresh(CachedNames cached) {
        return cached != null && Instant.now().getEpochSecond() < cached.expiresAt();
    }

    private Map<String, AirportRef> reload(CachedNames stale) {
        long now = Instant.now().getEpochSecond();
        try {
            Map<String, AirportRef> loaded = load();
            cache.set(new CachedNames(loaded, now + cacheTtlSeconds));
            return loaded;
        } catch (DataSourceUnavailableException | DataSourceRejectedException e) {
            // Имена аэропортов — украшение выдачи, ронять из-за них дашборд нечестно.
            LOG.warn("Справочник аэропортов не прочитан, топ уйдёт без названий", e);
            Map<String, AirportRef> fallback = stale == null ? Map.of() : stale.names();
            cache.set(new CachedNames(fallback, now + RETRY_AFTER_FAILURE_SECONDS));
            return fallback;
        }
    }

    private Map<String, AirportRef> load() {
        long startedAt = System.currentTimeMillis();
        List<JsonNode> rows = ytQueryClient.readTable(refAirportsPath + COLUMNS);
        Map<String, AirportRef> names = new HashMap<>(rows.size());
        for (JsonNode row : rows) {
            AirportRef airport = toAirportRef(row);
            if (airport != null) {
                names.putIfAbsent(airport.icao(), airport);
            }
        }
        LOG.info("Прочитан справочник аэропортов: {} кодов за {} мс", names.size(),
                System.currentTimeMillis() - startedAt);
        return names;
    }

    /** null для строки без кода: без него аэропорт в топе всё равно не найти. */
    static AirportRef toAirportRef(JsonNode row) {
        String icaoCode = YtRow.text(row, "icao_code");
        String icao = icaoCode != null ? icaoCode : YtRow.text(row, "ident");
        return icao == null ? null : new AirportRef(icao, YtRow.text(row, "iata_code"), YtRow.text(row, "name"));
    }

    private record CachedNames(Map<String, AirportRef> names, long expiresAt) {
    }
}
