package com.skypulse.analytics.model;

public record AirportTraffic(
        AirportRef airport,
        int departures,
        int arrivals,
        int totalFlights
) {
}
