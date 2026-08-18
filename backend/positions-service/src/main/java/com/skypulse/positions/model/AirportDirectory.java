package com.skypulse.positions.model;

import java.util.List;


public record AirportDirectory(List<Airport> airports, long asOf) {
}
