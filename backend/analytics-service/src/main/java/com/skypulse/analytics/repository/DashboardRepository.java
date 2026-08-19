package com.skypulse.analytics.repository;

import com.skypulse.analytics.model.DashboardSnapshot;
import com.skypulse.analytics.model.StatsWindow;

/** Порт к посчитанной пайплайном аналитике; YT-реализации ещё нет. */
public interface DashboardRepository {

    DashboardSnapshot load(StatsWindow window);
}
