package com.skypulse.analytics.repository;

import java.util.Collection;
import java.util.Map;

public interface FlightSegmentRepository {

    /** Позывные по идентификаторам рейсов; в airport_events их нет. */
    Map<String, String> callsignsByFlightId(Collection<String> flightIds);
}
