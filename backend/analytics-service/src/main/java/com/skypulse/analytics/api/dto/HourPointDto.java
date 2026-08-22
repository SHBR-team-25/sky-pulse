package com.skypulse.analytics.api.dto;

import com.skypulse.analytics.model.HourPoint;

public record HourPointDto(long hour, int departures, int arrivals, int totalFlights) {

    public static HourPointDto from(HourPoint point) {
        return new HourPointDto(
                point.hour(),
                point.departures(),
                point.arrivals(),
                point.departures() + point.arrivals());
    }
}
