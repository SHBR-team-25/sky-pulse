package com.skypulse.analytics.model;

import java.util.Locale;

public enum FlightDirection {
    ARRIVAL,
    DEPARTURE;

    public String code() {
        return name().toLowerCase(Locale.ROOT);
    }
}
