package com.skypulse.positions.model;

import java.util.List;

public record AirportDirectory(List<Airport> airports, Long asOf) {

    public AirportDirectory {
        airports = List.copyOf(airports);
    }
}
