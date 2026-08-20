package com.skypulse.analytics.service;

import com.skypulse.analytics.model.AirportTraffic;
import com.skypulse.analytics.model.AirportTrafficReport;
import com.skypulse.analytics.model.HourPoint;
import com.skypulse.analytics.model.HourlyTraffic;
import com.skypulse.analytics.model.StatsWindow;
import com.skypulse.analytics.repository.AirportDirectory;
import com.skypulse.analytics.repository.AirportEventsRepository;
import com.skypulse.analytics.repository.exception.DataSourceUnavailableException;
import com.skypulse.analytics.service.exception.AirportNotFoundException;
import com.skypulse.analytics.service.exception.InvalidIcaoException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class TrafficStatsService {

    // Заодно защищает от инъекции в QL-строку select_rows: код уходит в запрос как есть.
    private static final Pattern ICAO_PATTERN = Pattern.compile("^[A-Za-z0-9-]{2,8}$");

    private static final long HOUR_SECONDS = 3600L;

    private final AirportEventsRepository events;
    private final AirportDirectory airports;
    private final long windowSeconds;

    public TrafficStatsService(
            AirportEventsRepository events,
            AirportDirectory airports,
            @Value("${skypulse.stats.airport-window-seconds}") long windowSeconds) {
        this.events = events;
        this.airports = airports;
        this.windowSeconds = windowSeconds;
    }

    public AirportTrafficReport airports() {
        StatsWindow window = window();
        return new AirportTrafficReport(window, events.trafficByAirport(window));
    }

    public AirportTrafficReport airport(String icao) {
        String code = normalize(icao);
        // Пока справочник не прочитан, «неизвестный код» неотличим от опечатки,
        // и отвечать 404 на живой аэропорт нельзя — статистику отдаём как есть.
        if (airports.isLoaded() && airports.find(code).isEmpty()) {
            throw new AirportNotFoundException(code);
        }
        StatsWindow window = window();
        AirportTraffic traffic = events.trafficFor(code, window);
        return new AirportTrafficReport(window, List.of(traffic));
    }

    public HourlyTraffic hourly(String icao) {
        String code = icao == null ? null : normalize(icao);
        StatsWindow window = window();
        return new HourlyTraffic(window, fillGaps(events.hourlyTraffic(window, code), window));
    }

    /**
     * Окно — последние сутки данных, а не последние сутки по часам сервиса:
     * пайплайн встаёт, и по календарным суткам ответ был бы пустым при живых
     * событиях позавчерашнего батча.
     */
    private StatsWindow window() {
        long newest = events.newestEventTs().orElseThrow(() -> new DataSourceUnavailableException(
                "Таблица событий аэропортов пуста: джоба ещё ни разу не разметила рейсы"));
        return new StatsWindow(newest - windowSeconds, newest);
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

    private static String normalize(String icao) {
        if (icao == null || !ICAO_PATTERN.matcher(icao).matches()) {
            throw new InvalidIcaoException(icao);
        }
        return icao.toUpperCase(Locale.ROOT);
    }
}
