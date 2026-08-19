package com.skypulse.analytics.service;

import com.skypulse.analytics.model.DashboardSnapshot;
import com.skypulse.analytics.model.StatsWindow;
import com.skypulse.analytics.repository.DashboardRepository;
import java.time.Instant;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class DashboardService {

    private final DashboardRepository repository;
    private final long defaultWindowSeconds;

    public DashboardService(
            DashboardRepository repository,
            @Value("${skypulse.stats.default-window-seconds}") long defaultWindowSeconds) {
        this.repository = repository;
        this.defaultWindowSeconds = defaultWindowSeconds;
    }

    public DashboardSnapshot dashboard(Long from, Long to) {
        return repository.load(window(from, to));
    }

    // Границы окна необязательные: без них считаем последние defaultWindowSeconds.
    private StatsWindow window(Long from, Long to) {
        long end = to == null ? Instant.now().getEpochSecond() : to;
        long start = from == null ? end - defaultWindowSeconds : from;
        return new StatsWindow(start, end);
    }
}
