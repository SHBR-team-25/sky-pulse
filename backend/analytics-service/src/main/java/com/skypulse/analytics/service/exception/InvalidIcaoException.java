package com.skypulse.analytics.service.exception;

public class InvalidIcaoException extends InvalidRequestException {

    public InvalidIcaoException(String icao) {
        super("Код аэропорта должен быть из букв, цифр и дефиса длиной 2–8 символов, получено: " + icao);
    }
}
