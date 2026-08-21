package com.skypulse.positions.model;

public record TrackPoint(long timePosition, double lat, double lon, Double baroAltitude) {

    public TrackPoint {
        Coordinates.requireOnMap("Точка трека", lat, lon);
    }
}
