package com.skypulse.analytics.api.dto;

import com.skypulse.analytics.model.AirportTraffic;

public record BusiestAirportDto(
        AirportRefDto airport,
        int departures,
        int arrivals,
        int totalFlights
) {

    public static BusiestAirportDto from(AirportTraffic traffic) {
        return new BusiestAirportDto(
                AirportRefDto.from(traffic.airport()),
                traffic.departures(),
                traffic.arrivals(),
                traffic.totalFlights());
    }
}
