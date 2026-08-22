package com.skypulse.positions.service.exception;

public class PositionNotFoundException extends RuntimeException {

    public PositionNotFoundException(String icao24) {
        super("Позиция для борта icao24=%s не найдена".formatted(icao24));
    }
}
