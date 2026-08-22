package com.skypulse.analytics.service;

import com.skypulse.analytics.model.DashboardSnapshot;
import com.skypulse.analytics.repository.DashboardRepository;
import org.springframework.stereotype.Service;

@Service
public class DashboardService {

    private final DashboardRepository repository;

    public DashboardService(DashboardRepository repository) {
        this.repository = repository;
    }

    public DashboardSnapshot dashboard() {
        return repository.latest();
    }
}
