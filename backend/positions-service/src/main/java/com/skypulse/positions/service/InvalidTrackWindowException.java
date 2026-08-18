package com.skypulse.positions.service;

public class InvalidTrackWindowException extends InvalidRequestException {

    public InvalidTrackWindowException(long sinceSeconds, long maxSeconds) {
        super("Некорректное окно трека sinceSeconds=%d: ожидается от 1 до %d".formatted(sinceSeconds, maxSeconds));
    }
}
