package com.skypulse.analytics.repository.exception;

public class DataSourceRejectedException extends RuntimeException {

    public DataSourceRejectedException(String operation, int status, Throwable cause) {
        super("YTsaurus отклонил запрос %s: HTTP %d".formatted(operation, status), cause);
    }
}
