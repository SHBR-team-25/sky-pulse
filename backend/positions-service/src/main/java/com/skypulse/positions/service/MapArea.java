package com.skypulse.positions.service;

import com.skypulse.positions.model.BoundingBox;
import com.skypulse.positions.service.exception.InvalidAreaException;

/** Область карты из четырёх параметров: либо заданы все, либо область не задана. */
public final class MapArea {

    private static final double MAX_LON = 180.0;
    private static final double MAX_LAT = 90.0;

    private MapArea() {
    }

    public static BoundingBox of(Double lonMin, Double latMin, Double lonMax, Double latMax) {
        requireOnMap("lonMin", lonMin, MAX_LON);
        requireOnMap("latMin", latMin, MAX_LAT);
        requireOnMap("lonMax", lonMax, MAX_LON);
        requireOnMap("latMax", latMax, MAX_LAT);
        if (lonMin == null || latMin == null || lonMax == null || latMax == null) {
            return null;
        }
        return new BoundingBox(lonMin, latMin, lonMax, latMax);
    }

    // Spring разбирает "NaN" и "Infinity" как обычные Double, а YT такой QL не принимает.
    private static void requireOnMap(String parameter, Double value, double limit) {
        if (value != null && (!Double.isFinite(value) || Math.abs(value) > limit)) {
            throw new InvalidAreaException(parameter, value, limit);
        }
    }
}
