package com.skypulse.analytics.repository.exception;

public class MalformedRowException extends DataSourceUnavailableException {

    public MalformedRowException(String field) {
        super("В строке ответа YT нет обязательного поля " + field);
    }

    public MalformedRowException(String message, Throwable cause) {
        super(message, cause);
    }
}
