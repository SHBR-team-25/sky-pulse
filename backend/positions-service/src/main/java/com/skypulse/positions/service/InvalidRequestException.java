package com.skypulse.positions.service;

/**
 * Запрос разобран, но по смыслу негоден: виноват клиент, а не сервис
 * и не источник данных.
 */
public abstract class InvalidRequestException extends RuntimeException {

    protected InvalidRequestException(String message) {
        super(message);
    }
}
