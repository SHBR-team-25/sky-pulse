package com.skypulse.analytics.repository;

import com.fasterxml.jackson.databind.JsonNode;
import com.skypulse.analytics.model.AirportTraffic;
import com.skypulse.analytics.model.HourPoint;
import com.skypulse.analytics.model.StatsWindow;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.TreeMap;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;

/** Рейсы аэропортов пайплайн считает только в airport_events: в dashboard_* их нет. */
@Repository
public class YtAirportEventsRepository implements AirportEventsRepository {

    private static final long HOUR_SECONDS = 3600L;

    // Индексы в паре счётчиков: направлений всего два, и заводить под них класс незачем.
    private static final int DEPARTURES = 0;
    private static final int ARRIVALS = 1;

    private final YtQueryClient ytQueryClient;
    private final AirportDirectory airports;
    private final String airportEventsPath;

    public YtAirportEventsRepository(
            YtQueryClient ytQueryClient,
            AirportDirectory airports,
            @Value("${skypulse.yt.airport-events-path}") String airportEventsPath) {
        this.ytQueryClient = ytQueryClient;
        this.airports = airports;
        this.airportEventsPath = airportEventsPath;
    }

    @Override
    public Optional<Long> newestEventTs() {
        String query = "max(event_ts) as newest from [%s] group by 1".formatted(airportEventsPath);
        return ytQueryClient.selectRows(query).stream()
                .findFirst()
                .map(row -> YtRow.nullableLong(row, "newest"))
                .filter(Objects::nonNull);
    }

    @Override
    public List<AirportTraffic> trafficByAirport(StatsWindow window) {
        String query = """
                airport_icao, direction, sum(1) as event_count from [%s] \
                where event_ts >= %d and event_ts <= %d group by airport_icao, direction"""
                .formatted(airportEventsPath, window.from(), window.to());
        return withNames(foldByAirport(ytQueryClient.selectRows(query))).stream()
                .sorted(Comparator.comparingInt(AirportTraffic::totalFlights).reversed())
                .toList();
    }

    @Override
    public AirportTraffic trafficFor(String icao, StatsWindow window) {
        String query = """
                airport_icao, direction, sum(1) as event_count from [%s] \
                where airport_icao = '%s' and event_ts >= %d and event_ts <= %d \
                group by airport_icao, direction"""
                .formatted(airportEventsPath, icao, window.from(), window.to());
        // Аэропорт без событий за окно — это ноль рейсов, а не отсутствие аэропорта.
        return withNames(foldByAirport(ytQueryClient.selectRows(query))).stream()
                .findFirst()
                .orElseGet(() -> new AirportTraffic(airports.byIcao(icao), 0, 0, 0));
    }

    @Override
    public List<HourPoint> hourlyTraffic(StatsWindow window, String icao) {
        String airportFilter = icao == null ? "" : "airport_icao = '%s' and ".formatted(icao);
        String query = """
                event_ts / %d * %d as hour, direction, sum(1) as event_count from [%s] \
                where %sevent_ts >= %d and event_ts <= %d group by hour, direction"""
                .formatted(HOUR_SECONDS, HOUR_SECONDS, airportEventsPath,
                        airportFilter, window.from(), window.to());
        return foldByHour(ytQueryClient.selectRows(query));
    }

    private List<AirportTraffic> withNames(Map<String, int[]> counts) {
        List<AirportTraffic> traffic = new ArrayList<>(counts.size());
        counts.forEach((icao, byDirection) -> traffic.add(new AirportTraffic(
                airports.byIcao(icao),
                byDirection[DEPARTURES],
                byDirection[ARRIVALS],
                byDirection[DEPARTURES] + byDirection[ARRIVALS])));
        return traffic;
    }

    /**
     * Вылеты и прилёты приходят разными строками: условных сумм в YT QL нет,
     * поэтому направления сводятся в одну запись уже здесь.
     */
    static Map<String, int[]> foldByAirport(List<JsonNode> rows) {
        Map<String, int[]> counts = new LinkedHashMap<>();
        for (JsonNode row : rows) {
            String icao = YtRow.text(row, "airport_icao");
            int direction = directionIndex(row);
            if (icao != null && direction >= 0) {
                counts.computeIfAbsent(icao, key -> new int[2])[direction] += eventCount(row);
            }
        }
        return counts;
    }

    static List<HourPoint> foldByHour(List<JsonNode> rows) {
        Map<Long, int[]> counts = new TreeMap<>();
        for (JsonNode row : rows) {
            Long hour = YtRow.nullableLong(row, "hour");
            int direction = directionIndex(row);
            if (hour != null && direction >= 0) {
                counts.computeIfAbsent(hour, key -> new int[2])[direction] += eventCount(row);
            }
        }
        List<HourPoint> points = new ArrayList<>(counts.size());
        counts.forEach((hour, byDirection) ->
                points.add(new HourPoint(hour, byDirection[DEPARTURES], byDirection[ARRIVALS])));
        return points;
    }

    /** -1 для неизвестного направления: молча приписать его прилётам нельзя. */
    private static int directionIndex(JsonNode row) {
        String direction = YtRow.text(row, "direction");
        if ("departure".equals(direction)) {
            return DEPARTURES;
        }
        return "arrival".equals(direction) ? ARRIVALS : -1;
    }

    private static int eventCount(JsonNode row) {
        return (int) YtRow.requiredLong(row, "event_count");
    }
}
