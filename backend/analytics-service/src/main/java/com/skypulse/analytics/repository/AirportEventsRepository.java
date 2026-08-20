package com.skypulse.analytics.repository;

import com.skypulse.analytics.model.AirportTraffic;
import com.skypulse.analytics.model.HourPoint;
import com.skypulse.analytics.model.StatsWindow;
import java.util.List;
import java.util.Optional;

/** Вылеты и прилёты из airport_events: рейсы аэропортов пайплайн считает только здесь. */
public interface AirportEventsRepository {

    /** Пусто, если джоба ещё не записала ни одного события. */
    Optional<Long> newestEventTs();

    List<AirportTraffic> trafficByAirport(StatsWindow window);

    AirportTraffic trafficFor(String icao, StatsWindow window);

    List<HourPoint> hourlyTraffic(StatsWindow window, String icao);
}
