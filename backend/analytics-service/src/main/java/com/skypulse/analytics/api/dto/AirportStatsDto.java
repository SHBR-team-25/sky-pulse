package com.skypulse.analytics.api.dto;

import com.skypulse.analytics.model.AirportTraffic;
import com.skypulse.analytics.model.AirportTrafficReport;

public record AirportStatsDto(
        long from,
        long to,
        AirportRefDto airport,
        int departures,
        int arrivals,
        int totalFlights24h
) {

    public static AirportStatsDto from(AirportTrafficReport report) {
        AirportTraffic traffic = report.airports().getFirst();
        return new AirportStatsDto(
                report.window().from(),
                report.window().to(),
                AirportRefDto.from(traffic.airport()),
                traffic.departures(),
                traffic.arrivals(),
                traffic.totalFlights());
    }
}
