package com.skypulse.analytics.api.dto;

import com.skypulse.analytics.model.DashboardSnapshot;
import java.util.List;

public record DashboardDto(
        long from,
        long to,
        TotalsDto totals,
        FlightsByPhaseDto flightsByPhase,
        List<BusiestAirportDto> topBusiestAirports,
        List<TrafficPointDto> trafficTrend,
        int emergencyCount
) {

    public static DashboardDto from(DashboardSnapshot snapshot) {
        return new DashboardDto(
                snapshot.window().from(),
                snapshot.window().to(),
                TotalsDto.from(snapshot.totals()),
                FlightsByPhaseDto.from(snapshot.flightsByPhase()),
                snapshot.topBusiestAirports().stream().map(BusiestAirportDto::from).toList(),
                snapshot.trafficTrend().stream().map(TrafficPointDto::from).toList(),
                snapshot.emergencyCount());
    }
}
