package com.skypulse.analytics.repository;

import com.fasterxml.jackson.databind.JsonNode;
import com.skypulse.analytics.repository.exception.DataSourceRejectedException;
import com.skypulse.analytics.repository.exception.DataSourceUnavailableException;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;

/** Держит ref_aircraft в памяти: select_rows по статической таблице не работает. */
@Repository
public class YtAircraftDirectory implements AircraftDirectory {

    private static final Logger LOG = LoggerFactory.getLogger(YtAircraftDirectory.class);

    private static final String COLUMNS = "{icao24,operator}";

    private static final long RETRY_AFTER_FAILURE_SECONDS = 60L;

    private final YtQueryClient ytQueryClient;
    private final String refAircraftPath;
    private final long cacheTtlSeconds;
    private final AtomicReference<CachedOperators> cache = new AtomicReference<>();

    public YtAircraftDirectory(
            YtQueryClient ytQueryClient,
            @Value("${skypulse.yt.ref-aircraft-path}") String refAircraftPath,
            @Value("${skypulse.yt.ref-aircraft-cache-ttl-seconds}") long cacheTtlSeconds) {
        this.ytQueryClient = ytQueryClient;
        this.refAircraftPath = refAircraftPath;
        this.cacheTtlSeconds = cacheTtlSeconds;
    }

    @Override
    public Optional<String> operatorOf(String icao24) {
        return Optional.ofNullable(operators().get(icao24));
    }

    private Map<String, String> operators() {
        CachedOperators cached = cache.get();
        if (isFresh(cached)) {
            return cached.operators();
        }
        synchronized (this) {
            CachedOperators current = cache.get();
            return isFresh(current) ? current.operators() : reload(current);
        }
    }

    private static boolean isFresh(CachedOperators cached) {
        return cached != null && Instant.now().getEpochSecond() < cached.expiresAt();
    }

    private Map<String, String> reload(CachedOperators stale) {
        long now = Instant.now().getEpochSecond();
        try {
            Map<String, String> loaded = load();
            cache.set(new CachedOperators(loaded, now + cacheTtlSeconds));
            return loaded;
        } catch (DataSourceUnavailableException | DataSourceRejectedException e) {
            LOG.warn("Справочник ВС не прочитан, лог рейсов уйдёт без авиакомпаний", e);
            Map<String, String> fallback = stale == null ? Map.of() : stale.operators();
            cache.set(new CachedOperators(fallback, now + RETRY_AFTER_FAILURE_SECONDS));
            return fallback;
        }
    }

    private Map<String, String> load() {
        long startedAt = System.currentTimeMillis();
        var rows = ytQueryClient.readTable(refAircraftPath + COLUMNS);
        // Эксплуатант известен у каждого двадцатого борта из полумиллиона.
        Map<String, String> operators = new HashMap<>();
        for (JsonNode row : rows) {
            String icao24 = YtRow.text(row, "icao24");
            String operator = YtRow.text(row, "operator");
            if (icao24 != null && operator != null) {
                operators.putIfAbsent(icao24, operator);
            }
        }
        LOG.info("Прочитан справочник ВС: {} бортов с эксплуатантом из {} строк за {} мс",
                operators.size(), rows.size(), System.currentTimeMillis() - startedAt);
        return operators;
    }

    private record CachedOperators(Map<String, String> operators, long expiresAt) {
    }
}
