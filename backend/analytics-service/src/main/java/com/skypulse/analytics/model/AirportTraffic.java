package com.skypulse.analytics.model;

public record AirportTraffic(
        String icao,
        String name,
        int totalFlights
) {
}
