package com.skypulse.analytics.api.dto;

import com.skypulse.analytics.model.AirportTraffic;

public record BusiestAirportDto(AirportRefDto airport, int totalFlights) {

    public static BusiestAirportDto from(AirportTraffic traffic) {
        return new BusiestAirportDto(
                new AirportRefDto(traffic.icao(), traffic.name()),
                traffic.totalFlights());
    }
}
