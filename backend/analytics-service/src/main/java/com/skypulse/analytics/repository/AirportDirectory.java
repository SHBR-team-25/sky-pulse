package com.skypulse.analytics.repository;

import com.skypulse.analytics.model.AirportRef;

/** Справочник аэропортов: в dashboard_* лежат одни ICAO, имена берутся отсюда. */
public interface AirportDirectory {

    AirportRef byIcao(String icao);
}
