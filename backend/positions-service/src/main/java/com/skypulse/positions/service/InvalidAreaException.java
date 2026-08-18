package com.skypulse.positions.service;

public class InvalidAreaException extends InvalidRequestException {

    public InvalidAreaException(String parameter, double value, double limit) {
        super("Некорректная граница области %s=%s: ожидается число от -%s до %s"
                .formatted(parameter, value, limit, limit));
    }
}
