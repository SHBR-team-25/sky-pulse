package com.skypulse.positions.model;

final class Coordinates {

    private Coordinates() {
    }

    static void requireOnMap(String what, double lat, double lon) {
        boolean onMap = Double.isFinite(lat) && Math.abs(lat) <= 90
                && Double.isFinite(lon) && Math.abs(lon) <= 180;
        if (!onMap) {
            throw new IllegalArgumentException("%s вне карты: lat=%s lon=%s".formatted(what, lat, lon));
        }
    }
}
