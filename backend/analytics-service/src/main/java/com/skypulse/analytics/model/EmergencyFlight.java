package com.skypulse.analytics.model;

public record EmergencyFlight(
        String icao24,
        String callsign,
        String squawk,
        double lat,
        double lon,
        boolean onGround,
        long timePosition
) {
}
