package com.skypulse.positions.model;


public record Airport(
        String icao,
        String iata,
        String name,
        String type,
        String city,
        String country,
        double lat,
        double lon
) {
}
