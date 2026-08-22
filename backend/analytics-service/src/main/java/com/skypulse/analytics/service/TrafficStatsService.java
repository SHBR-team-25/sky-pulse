package com.skypulse.analytics.service;

import com.skypulse.analytics.model.AirportTraffic;
import com.skypulse.analytics.model.AirportTrafficReport;
import com.skypulse.analytics.model.HourPoint;
import com.skypulse.analytics.model.HourlyTraffic;
import com.skypulse.analytics.model.StatsWindow;
import com.skypulse.analytics.repository.AirportEventsRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class TrafficStatsService {

    private static final long HOUR_SECONDS = 3600L;

    private final AirportEventsRepository events;
    private final StatsWindows windows;

    public TrafficStatsService(AirportEventsRepository events, StatsWindows windows) {
        this.events = events;
        this.windows = windows;
    }

    public AirportTrafficReport airports() {
        StatsWindow window = windows.lastDayOfData();
        return new AirportTrafficReport(window, events.trafficByAirport(window));
    }

    public AirportTrafficReport airport(String icao) {
        String code = windows.requireKnownAirport(icao);
        StatsWindow window = windows.lastDayOfData();
        AirportTraffic traffic = events.trafficFor(code, window);
        return new AirportTrafficReport(window, List.of(traffic));
    }

    public HourlyTraffic hourly(String icao) {
        String code = icao == null ? null : windows.normalizeIcao(icao);
        StatsWindow window = windows.lastDayOfData();
        return new HourlyTraffic(window, fillGaps(events.hourlyTraffic(window, code), window));
    }

    /** Часы без событий нужны явными нулями, иначе на графике рвётся ось времени. */
    static List<HourPoint> fillGaps(List<HourPoint> points, StatsWindow window) {
        Map<Long, HourPoint> byHour = points.stream()
                .collect(Collectors.toMap(HourPoint::hour, Function.identity(), (first, second) -> first));
        long firstHour = window.from() / HOUR_SECONDS * HOUR_SECONDS;
        long lastHour = window.to() / HOUR_SECONDS * HOUR_SECONDS;
        List<HourPoint> filled = new ArrayList<>();
        for (long hour = firstHour; hour <= lastHour; hour += HOUR_SECONDS) {
            filled.add(byHour.getOrDefault(hour, new HourPoint(hour, 0, 0)));
        }
        return filled;
    }
}
