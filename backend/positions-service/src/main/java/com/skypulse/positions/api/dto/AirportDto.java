package com.skypulse.positions.api.dto;

import com.skypulse.positions.model.Airport;

public record AirportDto(
        String icao,
        String iata,
        String name,
        String city,
        String country,
        LatLonDto position
) {

    public static AirportDto from(Airport airport) {
        return new AirportDto(
                airport.icao(),
                airport.iata(),
                airport.name(),
                airport.city(),
                airport.country(),
                new LatLonDto(airport.lat(), airport.lon())
        );
    }
}
