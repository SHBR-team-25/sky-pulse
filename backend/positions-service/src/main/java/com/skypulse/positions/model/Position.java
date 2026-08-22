package com.skypulse.positions.model;

public record Position(
        String icao24,
        String callsign,
        String originCountry,
        long timePosition,
        double lat,
        double lon,
        Double baroAltitude,
        boolean onGround,
        Double velocity,
        Double trueTrack,
        String manufacturername,
        String model,
        String operator
) {

    public Position {
        if (icao24 == null || icao24.isBlank()) {
            throw new IllegalArgumentException("Позиция без icao24");
        }
        Coordinates.requireOnMap("Позиция " + icao24, lat, lon);
    }
}
