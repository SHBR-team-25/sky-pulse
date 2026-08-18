package com.skypulse.positions.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skypulse.positions.api.dto.BoundingBox;
import com.skypulse.positions.model.Position;
import org.junit.jupiter.api.Test;

class YtPositionRepositoryTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void mapsFullRowToPosition() throws Exception {
        JsonNode row = objectMapper.readTree("""
                {
                  "icao24": "01023b", "callsign": "MSC2932", "origin_country": "Egypt",
                  "time_position": 1786841273, "lat": 45.41, "lon": 20.0,
                  "baro_altitude": 10957.5, "on_ground": false, "velocity": 229.9,
                  "true_track": 324.75, "manufacturername": "Airbus Industrie",
                  "model": "A320-251N", "operator": "Air Cairo"
                }
                """);

        Position position = YtPositionRepository.toPosition(row);

        assertThat(position.icao24()).isEqualTo("01023b");
        assertThat(position.callsign()).isEqualTo("MSC2932");
        assertThat(position.timePosition()).isEqualTo(1786841273L);
        assertThat(position.baroAltitude()).isEqualTo(10957.5);
        assertThat(position.onGround()).isFalse();
        assertThat(position.operator()).isEqualTo("Air Cairo");
    }

    // FR4: борт без записи в ref_aircraft всё равно возвращается, обогащённые поля — null.
    @Test
    void mapsRowWithoutAircraftEnrichmentToNullFields() throws Exception {
        JsonNode row = objectMapper.readTree("""
                {
                  "icao24": "01025c", "callsign": "MSC931", "origin_country": "Egypt",
                  "time_position": 1786840204, "lat": 47.1, "lon": 20.15,
                  "baro_altitude": null, "on_ground": false, "velocity": null,
                  "true_track": 0.65, "manufacturername": null, "model": null, "operator": null
                }
                """);

        Position position = YtPositionRepository.toPosition(row);

        assertThat(position.icao24()).isEqualTo("01025c");
        assertThat(position.baroAltitude()).isNull();
        assertThat(position.velocity()).isNull();
        assertThat(position.manufacturername()).isNull();
        assertThat(position.model()).isNull();
        assertThat(position.operator()).isNull();
    }

    @Test
    void validatesIcao24Format() {
        assertThat(YtPositionRepository.isValidIcao24("01023b")).isTrue();
        assertThat(YtPositionRepository.isValidIcao24("ABCDEF")).isTrue();
        assertThat(YtPositionRepository.isValidIcao24(null)).isFalse();
        assertThat(YtPositionRepository.isValidIcao24("")).isFalse();
        assertThat(YtPositionRepository.isValidIcao24("01023")).isFalse();
        // Похоже на попытку инъекции в QL-запрос — должно отсекаться форматом, не эскейпингом.
        assertThat(YtPositionRepository.isValidIcao24("' or '1'='1")).isFalse();
    }

    // Отсечка по свежести нужна всегда, даже без bbox: иначе на карте остаются
    // борта, севшие часы назад, — positions_current строки не удаляет.
    @Test
    void filtersByFreshnessEvenWithoutBoundingBox() {
        assertThat(YtPositionRepository.whereClause(null, 1786841000L))
                .isEqualTo(" where time_position >= 1786841000");
    }

    @Test
    void combinesFreshnessAndBoundingBoxIntoSingleWhere() {
        assertThat(YtPositionRepository.whereClause(new BoundingBox(5.0, 45.0, 25.0, 55.0), 1786841000L))
                .isEqualTo(" where time_position >= 1786841000"
                        + " and lat between 45.0 and 55.0 and lon between 5.0 and 25.0");
    }

}
