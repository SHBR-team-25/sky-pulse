package com.skypulse.analytics.repository;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;

@Repository
public class YtFlightSegmentRepository implements FlightSegmentRepository {

    private final YtQueryClient ytQueryClient;
    private final String flightSegmentsPath;

    public YtFlightSegmentRepository(
            YtQueryClient ytQueryClient,
            @Value("${skypulse.yt.flights-segments-path}") String flightSegmentsPath) {
        this.ytQueryClient = ytQueryClient;
        this.flightSegmentsPath = flightSegmentsPath;
    }

    @Override
    public Map<String, String> callsignsByFlightId(Collection<String> flightIds) {
        if (flightIds.isEmpty()) {
            return Map.of();
        }
        String ids = flightIds.stream()
                .map(id -> "'" + id + "'")
                .collect(Collectors.joining(", "));
        String query = "flight_id, callsign from [%s] where flight_id in (%s)".formatted(flightSegmentsPath, ids);
        Map<String, String> callsigns = new HashMap<>();
        for (JsonNode row : ytQueryClient.selectRows(query)) {
            String flightId = YtRow.text(row, "flight_id");
            String callsign = YtRow.text(row, "callsign");
            if (flightId != null && callsign != null) {
                callsigns.put(flightId, callsign);
            }
        }
        return callsigns;
    }
}
