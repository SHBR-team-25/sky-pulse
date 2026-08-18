package com.skypulse.positions.service;

public class PositionNotFoundException extends RuntimeException {

    public PositionNotFoundException(String icao24) {
        super("Позиция для борта icao24=%s не найдена".formatted(icao24));
    }
}
