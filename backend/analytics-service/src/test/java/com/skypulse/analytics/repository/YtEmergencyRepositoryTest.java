package com.skypulse.analytics.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skypulse.analytics.model.EmergencyFlight;
import com.skypulse.analytics.repository.exception.MalformedRowException;
import org.junit.jupiter.api.Test;

class YtEmergencyRepositoryTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void mapsEmergencyRow() throws Exception {
        EmergencyFlight flight = YtEmergencyRepository.toFlight(objectMapper.readTree("""
                {
                  "icao24": "a981a8", "callsign": "N711VJ", "squawk": "7700",
                  "lat": 51.2944, "lon": 6.7829, "on_ground": false, "time_position": 1787165695
                }
                """));

        assertThat(flight.icao24()).isEqualTo("a981a8");
        assertThat(flight.callsign()).isEqualTo("N711VJ");
        assertThat(flight.squawk()).isEqualTo("7700");
        assertThat(flight.lat()).isEqualTo(51.2944);
        assertThat(flight.onGround()).isFalse();
        assertThat(flight.timePosition()).isEqualTo(1787165695L);
    }

    // Борт без координат на карте не поставить, а (0, 0) увело бы его в Атлантику.
    @Test
    void rejectsRowWithoutCoordinates() throws Exception {
        JsonNode withoutLat = objectMapper.readTree("""
                {"icao24": "a981a8", "squawk": "7700", "lon": 6.7829, "time_position": 1787165695}
                """);

        assertThatThrownBy(() -> YtEmergencyRepository.toFlight(withoutLat))
                .isInstanceOf(MalformedRowException.class);
    }
}
