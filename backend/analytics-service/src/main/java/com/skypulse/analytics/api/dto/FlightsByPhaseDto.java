package com.skypulse.analytics.api.dto;

import com.skypulse.analytics.model.FlightsByPhase;

public record FlightsByPhaseDto(
        int onGround,
        int airborne,
        int climbing,
        int descending
) {

    public static FlightsByPhaseDto from(FlightsByPhase phase) {
        return new FlightsByPhaseDto(
                phase.onGround(),
                phase.airborne(),
                phase.climbing(),
                phase.descending());
    }
}
