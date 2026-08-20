package com.skypulse.analytics.repository;

import com.skypulse.analytics.model.DashboardSnapshot;

public interface DashboardRepository {

    DashboardSnapshot latest();
}
