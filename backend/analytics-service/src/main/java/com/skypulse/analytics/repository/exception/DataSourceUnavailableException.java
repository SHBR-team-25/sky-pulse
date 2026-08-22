package com.skypulse.analytics.repository.exception;

public class DataSourceUnavailableException extends RuntimeException {

    public DataSourceUnavailableException(String message) {
        super(message);
    }

    public DataSourceUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
