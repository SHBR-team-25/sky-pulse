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

    public Airport {
        if (icao == null || icao.isBlank()) {
            throw new IllegalArgumentException("Аэропорт без кода");
        }
        Coordinates.requireOnMap("Аэропорт " + icao, lat, lon);
    }
}
