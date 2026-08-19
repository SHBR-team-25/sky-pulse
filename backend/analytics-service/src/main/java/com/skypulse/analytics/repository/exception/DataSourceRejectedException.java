package com.skypulse.analytics.repository.exception;

public class DataSourceRejectedException extends RuntimeException {

    public DataSourceRejectedException(String message) {
        super(message);
    }

    public DataSourceRejectedException(String message, Throwable cause) {
        super(message, cause);
    }
}
