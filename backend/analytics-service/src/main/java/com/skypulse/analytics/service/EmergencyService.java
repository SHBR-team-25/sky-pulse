package com.skypulse.analytics.service;

import com.skypulse.analytics.model.Emergencies;
import com.skypulse.analytics.repository.EmergencyRepository;
import java.time.Instant;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class EmergencyService {

    private final EmergencyRepository repository;
    private final long maxPositionAgeSeconds;

    public EmergencyService(
            EmergencyRepository repository,
            @Value("${skypulse.stats.max-position-age-seconds}") long maxPositionAgeSeconds) {
        this.repository = repository;
        this.maxPositionAgeSeconds = maxPositionAgeSeconds;
    }

    public Emergencies current() {
        return new Emergencies(Instant.now().getEpochSecond(), repository.current(maxPositionAgeSeconds));
    }
}
