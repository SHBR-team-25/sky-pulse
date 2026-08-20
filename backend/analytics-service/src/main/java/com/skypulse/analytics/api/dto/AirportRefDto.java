package com.skypulse.analytics.api.dto;

import com.skypulse.analytics.model.AirportRef;

public record AirportRefDto(String icao, String iata, String name) {

    public static AirportRefDto from(AirportRef airport) {
        return new AirportRefDto(airport.icao(), airport.iata(), airport.name());
    }
}
