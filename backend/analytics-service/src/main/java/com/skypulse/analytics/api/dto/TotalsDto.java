package com.skypulse.analytics.api.dto;

import com.skypulse.analytics.model.Totals;

public record TotalsDto(
        int activeFlights,
        int trackedAirports,
        double averageAltitudeM,
        double averageSpeedKmh
) {

    public static TotalsDto from(Totals totals) {
        return new TotalsDto(
                totals.activeFlights(),
                totals.trackedAirports(),
                totals.averageAltitudeM(),
                totals.averageSpeedKmh());
    }
}
