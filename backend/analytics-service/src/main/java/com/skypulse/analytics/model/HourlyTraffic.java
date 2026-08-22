package com.skypulse.analytics.model;

import java.util.List;

public record HourlyTraffic(StatsWindow window, List<HourPoint> points) {
}
