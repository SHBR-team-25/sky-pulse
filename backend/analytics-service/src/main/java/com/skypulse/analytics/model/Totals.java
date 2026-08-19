package com.skypulse.analytics.model;

public record Totals(
        int activeFlights,
        int trackedAirports,
        double averageAltitudeM,
        double averageSpeedKmh
) {
}
