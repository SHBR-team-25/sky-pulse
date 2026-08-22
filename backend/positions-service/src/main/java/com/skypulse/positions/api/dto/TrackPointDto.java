package com.skypulse.positions.api.dto;

import com.skypulse.positions.model.TrackPoint;

public record TrackPointDto(long timePosition, double lat, double lon, Double baroAltitude) {

    public static TrackPointDto from(TrackPoint point) {
        return new TrackPointDto(point.timePosition(), point.lat(), point.lon(), point.baroAltitude());
    }
}
