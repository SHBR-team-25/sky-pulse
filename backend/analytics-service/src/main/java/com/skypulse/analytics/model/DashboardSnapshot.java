package com.skypulse.analytics.model;

import java.util.List;

public record DashboardSnapshot(
        StatsWindow window,
        Totals totals,
        FlightsByPhase flightsByPhase,
        List<AirportTraffic> topBusiestAirports,
        List<TrafficPoint> trafficTrend,
        int emergencyCount
) {
}
