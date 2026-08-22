package com.skypulse.analytics.service.exception;

public class InvalidDirectionException extends InvalidRequestException {

    public InvalidDirectionException(String direction) {
        super("Направление должно быть arrival, departure или all, получено: " + direction);
    }
}
