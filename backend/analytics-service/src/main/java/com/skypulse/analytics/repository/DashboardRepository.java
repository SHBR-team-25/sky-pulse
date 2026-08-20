package com.skypulse.analytics.repository;

import com.skypulse.analytics.model.DashboardSnapshot;

/** Порт к посчитанным джобой таблицам dashboard_*; YT-реализации ещё нет. */
public interface DashboardRepository {

    DashboardSnapshot latest();
}
