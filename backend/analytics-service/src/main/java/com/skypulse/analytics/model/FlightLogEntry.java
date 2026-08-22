package com.skypulse.analytics.model;

public record FlightLogEntry(
        String icao24,
        String callsign,
        String airlineName,
        FlightDirection direction,
        AirportRef otherAirport,
        long observedAt,
        double confidence,
        double distanceKm
) {
}
