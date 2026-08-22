package com.skypulse.analytics.repository;

import com.skypulse.analytics.model.EmergencyFlight;
import java.util.List;

public interface EmergencyRepository {

    List<EmergencyFlight> current(long maxPositionAgeSeconds);
}
