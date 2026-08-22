package com.skypulse.analytics.api.dto;

import com.skypulse.analytics.model.EmergencyFlight;

public record EmergencyFlightDto(
        String icao24,
        String callsign,
        String squawk,
        double lat,
        double lon,
        boolean onGround,
        long timePosition
) {

    public static EmergencyFlightDto from(EmergencyFlight flight) {
        return new EmergencyFlightDto(
                flight.icao24(),
                flight.callsign(),
                flight.squawk(),
                flight.lat(),
                flight.lon(),
                flight.onGround(),
                flight.timePosition());
    }
}
