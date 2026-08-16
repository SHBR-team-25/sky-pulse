package com.skypulse.positions.api.dto;

import com.skypulse.positions.model.Position;

public record PositionDto(
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

    public static PositionDto from(Position p) {
        return new PositionDto(
                p.icao24(),
                p.callsign(),
                p.originCountry(),
                p.timePosition(),
                p.lat(),
                p.lon(),
                p.baroAltitude(),
                p.onGround(),
                p.velocity(),
                p.trueTrack(),
                p.manufacturername(),
                p.model(),
                p.operator()
        );
    }
}
