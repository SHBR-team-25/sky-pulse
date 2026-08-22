package com.skypulse.positions.service.exception;

/** Запрос разобран, но по смыслу негоден: виноват клиент, а не сервис и не источник. */
public abstract class InvalidRequestException extends RuntimeException {

    protected InvalidRequestException(String message) {
        super(message);
    }
}
