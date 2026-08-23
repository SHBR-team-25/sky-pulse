package com.skypulse.analytics.repository;

import com.skypulse.analytics.model.DashboardSnapshot;
import com.skypulse.analytics.repository.exception.DataSourceRejectedException;
import com.skypulse.analytics.repository.exception.DataSourceUnavailableException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Primary;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Repository;

@Repository
@Primary
public class CachedDashboardRepository implements DashboardRepository {

    private static final Logger LOG = LoggerFactory.getLogger(CachedDashboardRepository.class);

    private final DashboardRepository source;
    private final AtomicReference<DashboardSnapshot> cache = new AtomicReference<>();

    public CachedDashboardRepository(@Qualifier("ytDashboardRepository") DashboardRepository source) {
        this.source = source;
    }

    @Override
    public DashboardSnapshot latest() {
        DashboardSnapshot cached = cache.get();
        if (cached == null) {
            throw new DataSourceUnavailableException(
                    "Витрины дашборда ещё ни разу не прочитаны: джоба не отработала или YT недоступен с запуска");
        }
        return cached;
    }

    @Scheduled(fixedDelayString = "${skypulse.yt.dashboard-refresh-seconds}", timeUnit = TimeUnit.SECONDS)
    void refresh() {
        long startedAt = System.currentTimeMillis();
        try {
            DashboardSnapshot snapshot = source.latest();
            cache.set(snapshot);
            LOG.debug("Витрины дашборда обновлены за {} мс, поколение {}",
                    System.currentTimeMillis() - startedAt, snapshot.computedAt());
        } catch (DataSourceUnavailableException | DataSourceRejectedException e) {
            LOG.warn("Витрины дашборда не прочитаны, остаётся прежний снапшот", e);
        }
    }
}
