package com.skypulse.analytics.model;

import java.util.List;

public record AirportFlightLog(AirportRef airport, StatsWindow window, List<FlightLogEntry> flights) {
}
