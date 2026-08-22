package com.skypulse.analytics.model;

public record AirportEvent(
        String icao24,
        String flightId,
        FlightDirection direction,
        String otherAirportIcao,
        long observedAt,
        double confidence,
        double distanceKm
) {
}
