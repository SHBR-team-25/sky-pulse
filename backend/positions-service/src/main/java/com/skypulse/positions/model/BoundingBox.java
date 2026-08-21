package com.skypulse.positions.model;

public record BoundingBox(double lonMin, double latMin, double lonMax, double latMax) {

    public boolean contains(double lat, double lon) {
        return lat >= latMin && lat <= latMax && lon >= lonMin && lon <= lonMax;
    }
}
