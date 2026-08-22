package com.skypulse.analytics.repository;

import java.util.Optional;

/** Справочник ВС: авиакомпанию по борту знает только ref_aircraft. */
public interface AircraftDirectory {

    Optional<String> operatorOf(String icao24);
}
