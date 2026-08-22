package com.skypulse.analytics.service;

import com.skypulse.analytics.model.StatsWindow;
import com.skypulse.analytics.repository.AirportDirectory;
import com.skypulse.analytics.repository.AirportEventsRepository;
import com.skypulse.analytics.repository.exception.DataSourceUnavailableException;
import com.skypulse.analytics.service.exception.AirportNotFoundException;
import com.skypulse.analytics.service.exception.InvalidIcaoException;
import java.util.Locale;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/** Общее для ручек по событиям: окно данных и разбор кода аэропорта. */
@Service
public class StatsWindows {

    // Заодно защищает от инъекции в QL-строку select_rows.
    private static final Pattern ICAO_PATTERN = Pattern.compile("^[A-Za-z0-9-]{2,8}$");

    private final AirportEventsRepository events;
    private final AirportDirectory airports;
    private final long windowSeconds;

    public StatsWindows(
            AirportEventsRepository events,
            AirportDirectory airports,
            @Value("${skypulse.stats.airport-window-seconds}") long windowSeconds) {
        this.events = events;
        this.airports = airports;
        this.windowSeconds = windowSeconds;
    }

    /** Сутки данных, а не сутки по часам сервиса: на вставшем пайплайне окно было бы пустым. */
    public StatsWindow lastDayOfData() {
        long newest = events.newestEventTs().orElseThrow(() -> new DataSourceUnavailableException(
                "Таблица событий аэропортов пуста: джоба ещё ни разу не разметила рейсы"));
        return new StatsWindow(newest - windowSeconds, newest);
    }

    public String normalizeIcao(String icao) {
        if (icao == null || !ICAO_PATTERN.matcher(icao).matches()) {
            throw new InvalidIcaoException(icao);
        }
        return icao.toUpperCase(Locale.ROOT);
    }

    public String requireKnownAirport(String icao) {
        String code = normalizeIcao(icao);
        // Пока справочник не прочитан, опечатка неотличима от живого аэропорта.
        if (airports.isLoaded() && airports.find(code).isEmpty()) {
            throw new AirportNotFoundException(code);
        }
        return code;
    }
}
