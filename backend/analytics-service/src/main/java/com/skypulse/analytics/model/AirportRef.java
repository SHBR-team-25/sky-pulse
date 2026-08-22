package com.skypulse.analytics.model;

/** В dashboard_* лежит только ICAO: iata и name добираются из ref_airports и бывают null. */
public record AirportRef(String icao, String iata, String name) {
}
