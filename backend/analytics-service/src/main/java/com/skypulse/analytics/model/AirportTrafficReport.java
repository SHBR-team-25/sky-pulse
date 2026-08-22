package com.skypulse.analytics.model;

import java.util.List;

public record AirportTrafficReport(StatsWindow window, List<AirportTraffic> airports) {
}
