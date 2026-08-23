package com.skypulse.positions.repository;

import com.skypulse.positions.model.BoundingBox;
import com.skypulse.positions.model.Position;
import com.skypulse.positions.model.TrackPoint;
import com.skypulse.positions.repository.exception.DataSourceRejectedException;
import com.skypulse.positions.repository.exception.DataSourceUnavailableException;
import java.time.Clock;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Repository;

@Repository
@Primary
public class CachedPositionRepository implements PositionRepository {

    private static final Logger LOG = LoggerFactory.getLogger(CachedPositionRepository.class);

    private final PositionSnapshotSource source;
    private final Clock clock;
    private final long maxPositionAgeSeconds;
    private final long refreshSeconds;
    private final AtomicReference<Snapshot> cache = new AtomicReference<>();

    public CachedPositionRepository(
            PositionSnapshotSource source,
            Clock clock,
            @Value("${skypulse.yt.max-position-age-seconds}") long maxPositionAgeSeconds,
            @Value("${skypulse.yt.positions-refresh-seconds}") long refreshSeconds) {
        this.source = source;
        this.clock = clock;
        this.maxPositionAgeSeconds = maxPositionAgeSeconds;
        this.refreshSeconds = refreshSeconds;
    }

    @Override
    public List<Position> currentPositions(BoundingBox area) {
        Snapshot snapshot = cache.get();
        if (snapshot == null) {
            return source.currentPositions(area);
        }
        long freshnessThreshold = nowSeconds() - maxPositionAgeSeconds;
        return snapshot.positions().stream()
                .filter(position -> position.timePosition() >= freshnessThreshold)
                .filter(position -> area == null || area.contains(position.lat(), position.lon()))
                .toList();
    }

    // Снапшот отфильтрован по свежести, а latest её никогда не применял: без запроса
    // в YT на промахе севший борт отдавал бы 404 вместо последней известной позиции.
    @Override
    public Optional<Position> latestByIcao24(String icao24) {
        Snapshot snapshot = cache.get();
        Position cached = snapshot == null ? null : snapshot.byIcao24().get(icao24.toLowerCase(Locale.ROOT));
        return cached != null ? Optional.of(cached) : source.latestByIcao24(icao24);
    }

    @Override
    public List<TrackPoint> historyByIcao24(String icao24, long sinceSeconds) {
        return source.historyByIcao24(icao24, sinceSeconds);
    }

    @Scheduled(fixedDelayString = "${skypulse.yt.positions-refresh-seconds}", timeUnit = TimeUnit.SECONDS)
    void refresh() {
        long startedAt = System.currentTimeMillis();
        // Запас в один период: точную отсечку применяет каждый запрос к снапшоту, иначе
        // между обновлениями она замерзала бы на моменте чтения.
        long timePositionFrom = nowSeconds() - maxPositionAgeSeconds - refreshSeconds;
        try {
            List<Position> positions = source.positionsSince(timePositionFrom);
            cache.set(Snapshot.of(positions));
            LOG.debug("Снапшот позиций обновлён: {} бортов за {} мс",
                    positions.size(), System.currentTimeMillis() - startedAt);
        } catch (DataSourceUnavailableException | DataSourceRejectedException e) {
            LOG.warn("Позиции не прочитаны, остаётся прежний снапшот", e);
        }
    }

    private long nowSeconds() {
        return clock.instant().getEpochSecond();
    }

    private record Snapshot(List<Position> positions, Map<String, Position> byIcao24) {

        static Snapshot of(List<Position> positions) {
            Map<String, Position> byIcao24 = new HashMap<>(positions.size());
            positions.forEach(position -> byIcao24.put(position.icao24().toLowerCase(Locale.ROOT), position));
            return new Snapshot(positions, byIcao24);
        }
    }
}
