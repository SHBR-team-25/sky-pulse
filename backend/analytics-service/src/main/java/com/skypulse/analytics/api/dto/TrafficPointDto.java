package com.skypulse.analytics.api.dto;

import com.skypulse.analytics.model.TrafficPoint;

public record TrafficPointDto(long timestamp, int activeFlights) {

    public static TrafficPointDto from(TrafficPoint point) {
        return new TrafficPointDto(point.timestamp(), point.activeFlights());
    }
}
