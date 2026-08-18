package com.skypulse.positions.model;

import java.util.List;

public record AirportPage(List<Airport> items, int page, int pageSize, int total, Long asOf) {

    public AirportPage {
        items = List.copyOf(items);
    }
}
