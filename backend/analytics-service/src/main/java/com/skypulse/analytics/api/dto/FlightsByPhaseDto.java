package com.skypulse.analytics.api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.skypulse.analytics.model.FlightsByPhase;

public record FlightsByPhaseDto(
        @JsonProperty("on_ground") int onGround,
        int climbing,
        int descending,
        int cruising
) {

    public static FlightsByPhaseDto from(FlightsByPhase phase) {
        return new FlightsByPhaseDto(
                phase.onGround(),
                phase.climbing(),
                phase.descending(),
                phase.cruising());
    }
}
