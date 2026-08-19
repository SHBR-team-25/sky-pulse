package com.skypulse.positions.repository.exception;

public class DataSourceUnavailableException extends RuntimeException {

    public DataSourceUnavailableException(String message) {
        super(message);
    }

    public DataSourceUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
