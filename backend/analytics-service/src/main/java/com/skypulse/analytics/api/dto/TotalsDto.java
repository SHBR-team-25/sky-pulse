package com.skypulse.analytics.api.dto;

import com.skypulse.analytics.model.Totals;

public record TotalsDto(
        int activeFlights,
        int trackedAirports,
        Double averageAltitudeM,
        Double averageSpeedKmh
) {

    private static final double MPS_TO_KMH = 3.6;

    public static TotalsDto from(Totals totals) {
        // В YT скорость лежит в м/с, как в OpenSky; контракт дашборда — в км/ч.
        Double speedMps = totals.averageSpeedMps();
        return new TotalsDto(
                totals.activeFlights(),
                totals.trackedAirports(),
                totals.averageAltitudeM(),
                speedMps == null ? null : speedMps * MPS_TO_KMH);
    }
}
