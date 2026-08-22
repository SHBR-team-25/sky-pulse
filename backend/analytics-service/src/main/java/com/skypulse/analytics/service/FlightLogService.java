package com.skypulse.analytics.service;

import com.skypulse.analytics.model.AirportEvent;
import com.skypulse.analytics.model.AirportFlightLog;
import com.skypulse.analytics.model.FlightDirection;
import com.skypulse.analytics.model.FlightLogEntry;
import com.skypulse.analytics.model.StatsWindow;
import com.skypulse.analytics.repository.AircraftDirectory;
import com.skypulse.analytics.repository.AirportDirectory;
import com.skypulse.analytics.repository.AirportEventsRepository;
import com.skypulse.analytics.repository.FlightSegmentRepository;
import com.skypulse.analytics.service.exception.InvalidDirectionException;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class FlightLogService {

    private static final String ANY_DIRECTION = "all";

    private final AirportEventsRepository events;
    private final FlightSegmentRepository segments;
    private final AirportDirectory airports;
    private final AircraftDirectory aircraft;
    private final StatsWindows windows;

    public FlightLogService(
            AirportEventsRepository events,
            FlightSegmentRepository segments,
            AirportDirectory airports,
            AircraftDirectory aircraft,
            StatsWindows windows) {
        this.events = events;
        this.segments = segments;
        this.airports = airports;
        this.aircraft = aircraft;
        this.windows = windows;
    }

    public AirportFlightLog log(String icao, String direction) {
        String code = windows.requireKnownAirport(icao);
        StatsWindow window = windows.lastDayOfData();
        List<AirportEvent> found = events.events(code, window, parseDirection(direction));
        return new AirportFlightLog(airports.byIcao(code), window, toEntries(found));
    }

    private List<FlightLogEntry> toEntries(List<AirportEvent> found) {
        Set<String> flightIds = found.stream().map(AirportEvent::flightId).collect(Collectors.toSet());
        Map<String, String> callsigns = segments.callsignsByFlightId(flightIds);
        return found.stream().map(event -> new FlightLogEntry(
                event.icao24(),
                callsigns.get(event.flightId()),
                aircraft.operatorOf(event.icao24()).orElse(null),
                event.direction(),
                event.otherAirportIcao() == null ? null : airports.byIcao(event.otherAirportIcao()),
                event.observedAt(),
                event.confidence(),
                event.distanceKm())).toList();
    }

    private static FlightDirection parseDirection(String direction) {
        if (direction == null || ANY_DIRECTION.equalsIgnoreCase(direction)) {
            return null;
        }
        return switch (direction.toLowerCase(Locale.ROOT)) {
            case "arrival" -> FlightDirection.ARRIVAL;
            case "departure" -> FlightDirection.DEPARTURE;
            default -> throw new InvalidDirectionException(direction);
        };
    }
}
