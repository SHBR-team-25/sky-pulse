package com.skypulse.analytics.model;

public record Totals(
        int activeFlights,
        int trackedAirports,
        // avg_altitude_m и avg_velocity_mps в YT nullable: ноль означал бы полёт на уровне моря.
        Double averageAltitudeM,
        Double averageSpeedMps
) {
}
