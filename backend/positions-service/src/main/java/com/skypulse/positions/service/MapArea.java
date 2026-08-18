package com.skypulse.positions.service;

import com.skypulse.positions.model.BoundingBox;

/**
 * Собирает область карты из четырёх параметров запроса. Правило «заданы либо
 * все четыре, либо ни одного» — продуктовое, поэтому живёт в одном месте,
 * а не отдельной копией в каждом контроллере.
 */
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

    // Spring разбирает "NaN" и "Infinity" как обычные Double, и такое значение
    // доезжало до QL-запроса, а оттуда возвращалось клиенту как отказ YTsaurus.
    private static void requireOnMap(String parameter, Double value, double limit) {
        if (value != null && (!Double.isFinite(value) || Math.abs(value) > limit)) {
            throw new InvalidAreaException(parameter, value, limit);
        }
    }
}
