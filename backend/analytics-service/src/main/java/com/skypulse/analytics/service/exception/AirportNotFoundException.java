package com.skypulse.analytics.service.exception;

public class AirportNotFoundException extends RuntimeException {

    public AirportNotFoundException(String icao) {
        super("Аэропорт " + icao + " не найден в справочнике");
    }
}
