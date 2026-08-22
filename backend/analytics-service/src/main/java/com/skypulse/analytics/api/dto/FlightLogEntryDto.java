package com.skypulse.analytics.api.dto;

import com.skypulse.analytics.model.FlightLogEntry;

public record FlightLogEntryDto(
        String icao24,
        String callsign,
        String airlineName,
        String direction,
        AirportRefDto otherAirport,
        long observedAt,
        double confidence,
        double distanceKm
) {

    public static FlightLogEntryDto from(FlightLogEntry entry) {
        return new FlightLogEntryDto(
                entry.icao24(),
                entry.callsign(),
                entry.airlineName(),
                entry.direction().code(),
                entry.otherAirport() == null ? null : AirportRefDto.from(entry.otherAirport()),
                entry.observedAt(),
                entry.confidence(),
                entry.distanceKm());
    }
}
