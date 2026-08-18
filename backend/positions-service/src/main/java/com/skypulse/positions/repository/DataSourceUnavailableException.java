package com.skypulse.positions.repository;

/**
 * Источник данных не ответил или ответил негодным: сам сервис исправен,
 * повторить запрос имеет смысл.
 */
public class DataSourceUnavailableException extends RuntimeException {

    public DataSourceUnavailableException(String message) {
        super(message);
    }

    public DataSourceUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
