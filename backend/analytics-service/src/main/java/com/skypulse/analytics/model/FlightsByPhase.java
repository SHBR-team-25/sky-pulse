package com.skypulse.analytics.model;

/** airborne — все борта не на земле, поэтому сумма полей не равна activeFlights. */
public record FlightsByPhase(
        int onGround,
        int airborne,
        int climbing,
        int descending
) {
}
