package com.skypulse.analytics.model;

public record FlightsByPhase(
        int onGround,
        int climbing,
        int descending,
        int cruising
) {
}
