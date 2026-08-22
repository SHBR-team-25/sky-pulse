package com.skypulse.analytics.model;

/** Окно агрегации в unix-секундах, границы включительно. */
public record StatsWindow(long from, long to) {
}
