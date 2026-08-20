package com.skypulse.analytics.model;

import java.util.List;

/** Снапшот, а не выборка за период: окна агрегации в YT нет, есть момент пересчёта. */
public record DashboardSnapshot(
        long computedAt,
        Totals totals,
        FlightsByPhase flightsByPhase,
        List<AirportTraffic> topBusiestAirports,
        List<RouteTraffic> busiestRoutes,
        List<ManufacturerShare> aircraftByManufacturer,
        List<TrafficPoint> trafficTrend,
        int emergencyCount
) {
}
