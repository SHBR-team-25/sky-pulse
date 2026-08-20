package com.skypulse.analytics.repository;

import com.skypulse.analytics.model.DashboardSnapshot;

/**
 * Порт к статистике дашборда; YT-реализации ещё нет. Часть снапшота приходит
 * из таблиц dashboard_*, страны и авиакомпании — из positions_current.
 */
public interface DashboardRepository {

    DashboardSnapshot latest();
}
