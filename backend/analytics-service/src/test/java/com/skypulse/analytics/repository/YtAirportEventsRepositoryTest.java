package com.skypulse.analytics.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skypulse.analytics.model.HourPoint;
import java.util.List;
import org.junit.jupiter.api.Test;

class YtAirportEventsRepositoryTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    private JsonNode row(String json) throws Exception {
        return objectMapper.readTree(json);
    }

    // Условных сумм в YT QL нет, поэтому направления приходят разными строками.
    @Test
    void foldsDirectionsOfOneAirportIntoSingleEntry() throws Exception {
        var counts = YtAirportEventsRepository.foldByAirport(List.of(
                row("""
                        {"airport_icao": "EDDK", "direction": "arrival", "event_count": 71}
                        """),
                row("""
                        {"airport_icao": "EDDK", "direction": "departure", "event_count": 13}
                        """),
                row("""
                        {"airport_icao": "LIMC", "direction": "arrival", "event_count": 40}
                        """)));

        assertThat(counts).containsOnlyKeys("EDDK", "LIMC");
        assertThat(counts.get("EDDK")).containsExactly(13, 71);
        assertThat(counts.get("LIMC")).containsExactly(0, 40);
    }

    // Неизвестное направление нельзя молча приписать прилётам.
    @Test
    void skipsRowsWithUnknownDirection() throws Exception {
        var counts = YtAirportEventsRepository.foldByAirport(List.of(
                row("""
                        {"airport_icao": "EDDK", "direction": "overflight", "event_count": 5}
                        """)));

        assertThat(counts).isEmpty();
    }

    @Test
    void foldsHoursInChronologicalOrder() throws Exception {
        List<HourPoint> points = YtAirportEventsRepository.foldByHour(List.of(
                row("""
                        {"hour": 1787133600, "direction": "arrival", "event_count": 44}
                        """),
                row("""
                        {"hour": 1787130000, "direction": "departure", "event_count": 41}
                        """),
                row("""
                        {"hour": 1787133600, "direction": "departure", "event_count": 3}
                        """)));

        assertThat(points).containsExactly(
                new HourPoint(1787130000L, 41, 0),
                new HourPoint(1787133600L, 3, 44));
    }
}
