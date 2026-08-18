package com.skypulse.positions.api.dto;

public record BoundingBox(double minLat, double minLon, double maxLat, double maxLon) {

    public boolean contains(double lat, double lon) {
        return lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon;
    }
}
