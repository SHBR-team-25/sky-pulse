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
}
