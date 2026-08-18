package com.skypulse.positions.repository;

/**
 * YTsaurus отклонил сам запрос: кривой QL, чужой путь таблицы, протухший
 * токен. Повтор не поможет — чинить нужно сервис или его конфигурацию.
 */
public class DataSourceRejectedException extends RuntimeException {

    public DataSourceRejectedException(String operation, int status, Throwable cause) {
        super("YTsaurus отклонил запрос %s: HTTP %d".formatted(operation, status), cause);
    }
}
