package com.skypulse.positions.service;

public class InvalidIcao24Exception extends InvalidRequestException {

    public InvalidIcao24Exception(String icao24) {
        super("Некорректный код борта icao24=%s: ожидаются 6 шестнадцатеричных символов".formatted(icao24));
    }
}
