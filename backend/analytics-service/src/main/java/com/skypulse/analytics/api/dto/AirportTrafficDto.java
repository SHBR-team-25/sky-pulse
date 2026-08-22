package com.skypulse.analytics.api.dto;

import com.skypulse.analytics.model.AirportTraffic;

public record AirportTrafficDto(
        AirportRefDto airport,
        int departures,
        int arrivals,
        int totalFlights24h
) {

    public static AirportTrafficDto from(AirportTraffic traffic) {
        return new AirportTrafficDto(
                AirportRefDto.from(traffic.airport()),
                traffic.departures(),
                traffic.arrivals(),
                traffic.totalFlights());
    }
}
