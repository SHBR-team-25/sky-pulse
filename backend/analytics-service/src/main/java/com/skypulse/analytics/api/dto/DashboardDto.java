package com.skypulse.analytics.api.dto;

import com.skypulse.analytics.model.DashboardSnapshot;
import java.util.List;

public record DashboardDto(
        long computedAt,
        TotalsDto totals,
        FlightsByPhaseDto flightsByPhase,
        List<BusiestAirportDto> topBusiestAirports,
        List<BusiestRouteDto> busiestRoutes,
        List<ManufacturerShareDto> aircraftByManufacturer,
        List<TrafficPointDto> trafficTrend,
        int emergencyCount
) {

    public static DashboardDto from(DashboardSnapshot snapshot) {
        return new DashboardDto(
                snapshot.computedAt(),
                TotalsDto.from(snapshot.totals()),
                FlightsByPhaseDto.from(snapshot.flightsByPhase()),
                snapshot.topBusiestAirports().stream().map(BusiestAirportDto::from).toList(),
                snapshot.busiestRoutes().stream().map(BusiestRouteDto::from).toList(),
                snapshot.aircraftByManufacturer().stream().map(ManufacturerShareDto::from).toList(),
                snapshot.trafficTrend().stream().map(TrafficPointDto::from).toList(),
                snapshot.emergencyCount());
    }
}
