package com.skypulse.analytics;

import com.skypulse.analytics.model.AirportEvent;
import com.skypulse.analytics.model.AirportRef;
import com.skypulse.analytics.model.AirportTraffic;
import com.skypulse.analytics.model.EmergencyFlight;
import com.skypulse.analytics.model.FlightDirection;
import com.skypulse.analytics.model.HourPoint;
import com.skypulse.analytics.model.StatsWindow;
import com.skypulse.analytics.repository.AircraftDirectory;
import com.skypulse.analytics.repository.AirportDirectory;
import com.skypulse.analytics.repository.AirportEventsRepository;
import com.skypulse.analytics.repository.EmergencyRepository;
import com.skypulse.analytics.repository.FlightSegmentRepository;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

/** Фейковые реализации портов: в src/main заглушек нет, они живут только здесь. */
final class StubPorts {

    static final AirportRef KOELN = new AirportRef("EDDK", "CGN", "Cologne Bonn Airport");

    static final long NEWEST_EVENT_TS = 1787134015L;

    static final String FLIGHT_ID = "1cfe6079aca5ad3241852f48e3ffccb8";

    private StubPorts() {
    }

    static AirportDirectory directory() {
        Map<String, AirportRef> known = Map.of(KOELN.icao(), KOELN);
        return new AirportDirectory() {

            @Override
            public Optional<AirportRef> find(String icao) {
                return Optional.ofNullable(known.get(icao));
            }

            @Override
            public boolean isLoaded() {
                return true;
            }
        };
    }

    static AirportEventsRepository events(AtomicReference<Optional<Long>> newest) {
        return new AirportEventsRepository() {

            @Override
            public Optional<Long> newestEventTs() {
                return newest.get();
            }

            @Override
            public List<AirportTraffic> trafficByAirport(StatsWindow window) {
                return List.of(new AirportTraffic(KOELN, 13, 71, 84));
            }

            @Override
            public AirportTraffic trafficFor(String icao, StatsWindow window) {
                return new AirportTraffic(KOELN, 13, 71, 84);
            }

            @Override
            public List<HourPoint> hourlyTraffic(StatsWindow window, String icao) {
                return List.of(new HourPoint(window.to() / 3600 * 3600, 3, 44));
            }

            @Override
            public List<AirportEvent> events(String icao, StatsWindow window, FlightDirection direction) {
                var arrival = new AirportEvent(
                        "4bccad", FLIGHT_ID, FlightDirection.ARRIVAL, KOELN.icao(),
                        NEWEST_EVENT_TS, 0.91, 1.31);
                var departure = new AirportEvent(
                        "4cace0", "9cd4b8425dd38cc2ea8233d9be438a00", FlightDirection.DEPARTURE, null,
                        NEWEST_EVENT_TS - 600, 0.83, 2.46);
                return direction == null
                        ? List.of(arrival, departure)
                        : List.of(direction == FlightDirection.ARRIVAL ? arrival : departure);
            }
        };
    }

    static EmergencyRepository emergencies(AtomicReference<List<EmergencyFlight>> flights) {
        return maxAge -> flights.get();
    }

    static FlightSegmentRepository segments() {
        return flightIds -> Map.of(FLIGHT_ID, "SXS4RX");
    }

    static AircraftDirectory aircraft() {
        return icao24 -> Optional.ofNullable("4bccad".equals(icao24) ? "SunExpress" : null);
    }
}
