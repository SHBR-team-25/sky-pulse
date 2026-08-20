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
        // Страны и авиакомпании отдельной dashboard_*-таблицы не имеют: их
        // репозиторий считает по positions_current в момент запроса.
        List<CountryShare> topCountries,
        List<AirlineShare> topAirlines,
        List<TrafficPoint> trafficTrend,
        int emergencyCount
) {
}
