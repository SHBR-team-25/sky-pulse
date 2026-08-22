package com.skypulse.analytics.model;

public record RouteTraffic(
        AirportRef origin,
        AirportRef destination,
        int flightCount
) {
}
