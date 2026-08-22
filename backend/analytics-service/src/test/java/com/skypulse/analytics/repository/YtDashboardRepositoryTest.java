package com.skypulse.analytics.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skypulse.analytics.model.AirportRef;
import com.skypulse.analytics.model.AirportTraffic;
import com.skypulse.analytics.model.FlightsByPhase;
import com.skypulse.analytics.model.RouteTraffic;
import com.skypulse.analytics.model.Totals;
import com.skypulse.analytics.model.TrafficPoint;
import com.skypulse.analytics.repository.exception.MalformedRowException;
import java.util.List;
import java.util.function.Function;
import org.junit.jupiter.api.Test;

class YtDashboardRepositoryTest {

    private static final Function<String, AirportRef> NAMELESS = icao -> new AirportRef(icao, null, null);

    private final ObjectMapper objectMapper = new ObjectMapper();

    private JsonNode row(String json) throws Exception {
        return objectMapper.readTree(json);
    }

    @Test
    void mapsTotalsRow() throws Exception {
        Totals totals = YtDashboardRepository.toTotals(row("""
                {
                  "computed_at": 1787132036, "active_flights": 917, "tracked_airports": 38,
                  "avg_altitude_m": 9412.5, "avg_velocity_mps": 221.4
                }
                """));

        assertThat(totals.activeFlights()).isEqualTo(917);
        assertThat(totals.trackedAirports()).isEqualTo(38);
        assertThat(totals.averageAltitudeM()).isEqualTo(9412.5);
        assertThat(totals.averageSpeedMps()).isEqualTo(221.4);
    }

    // Пересчёт по окну без бортов пишет null, и ноль здесь означал бы «летели
    // на уровне моря со скоростью ноль».
    @Test
    void keepsMissingAveragesNull() throws Exception {
        Totals totals = YtDashboardRepository.toTotals(row("""
                {
                  "computed_at": 1787132036, "active_flights": 0, "tracked_airports": 38,
                  "avg_altitude_m": null, "avg_velocity_mps": null
                }
                """));

        assertThat(totals.averageAltitudeM()).isNull();
        assertThat(totals.averageSpeedMps()).isNull();
    }

    @Test
    void mapsPhasesRow() throws Exception {
        FlightsByPhase phases = YtDashboardRepository.toPhases(row("""
                {"on_ground": 120, "airborne": 797, "climbing": 210, "descending": 180}
                """));

        assertThat(phases.onGround()).isEqualTo(120);
        assertThat(phases.airborne()).isEqualTo(797);
        assertThat(phases.climbing()).isEqualTo(210);
        assertThat(phases.descending()).isEqualTo(180);
    }

    @Test
    void enrichesAirportWithDirectoryNames() throws Exception {
        Function<String, AirportRef> directory =
                icao -> new AirportRef(icao, "CGN", "Cologne Bonn Airport");

        AirportTraffic traffic = YtDashboardRepository.toAirportTraffic(row("""
                {
                  "rank": 1, "airport_icao": "EDDK", "departures": 12,
                  "arrivals": 64, "total_flights": 76, "computed_at": 1787132036
                }
                """), directory);

        assertThat(traffic.airport()).isEqualTo(new AirportRef("EDDK", "CGN", "Cologne Bonn Airport"));
        assertThat(traffic.departures()).isEqualTo(12);
        assertThat(traffic.arrivals()).isEqualTo(64);
        assertThat(traffic.totalFlights()).isEqualTo(76);
    }

    @Test
    void mapsRouteRow() throws Exception {
        RouteTraffic route = YtDashboardRepository.toRoute(row("""
                {"rank": 1, "departure_icao": "EDDK", "arrival_icao": "LIMC", "flight_count": 5}
                """), NAMELESS);

        assertThat(route.origin().icao()).isEqualTo("EDDK");
        assertThat(route.destination().icao()).isEqualTo("LIMC");
        assertThat(route.flightCount()).isEqualTo(5);
    }

    @Test
    void mapsTrendPoint() throws Exception {
        TrafficPoint point = YtDashboardRepository.toTrendPoint(row("""
                {"computed_at": 1787132036, "active_aircraft": 788}
                """));

        assertThat(point.timestamp()).isEqualTo(1787132036L);
        assertThat(point.activeFlights()).isEqualTo(788);
    }

    // Пустая ячейка в Jackson молча читается как ноль, а «аэропорт без кода» —
    // это битая строка, а не аэропорт с нулевым трафиком.
    @Test
    void rejectsRowWithoutRequiredFields() throws Exception {
        JsonNode withoutIcao = row("""
                {"departures": 12, "arrivals": 64, "total_flights": 76}
                """);
        JsonNode withoutCount = row("""
                {"manufacturer": "Boeing"}
                """);

        assertThatThrownBy(() -> YtDashboardRepository.toAirportTraffic(withoutIcao, NAMELESS))
                .isInstanceOf(MalformedRowException.class);
        assertThatThrownBy(() -> YtDashboardRepository.toManufacturer(withoutCount))
                .isInstanceOf(MalformedRowException.class);
    }

    // Джоба перезаписывает таблицы целиком, но если начнёт дописывать, смешать
    // поколения в одном ответе нельзя: числа перестанут сходиться между собой.
    @Test
    void keepsOnlyRowsOfTheNewestGeneration() throws Exception {
        List<JsonNode> rows = List.of(
                row("""
                        {"airport_icao": "EDDK", "total_flights": 76, "computed_at": 1787132036}
                        """),
                row("""
                        {"airport_icao": "EDDP", "total_flights": 56, "computed_at": 1787132036}
                        """),
                row("""
                        {"airport_icao": "LIMC", "total_flights": 48, "computed_at": 1787045636}
                        """));

        List<JsonNode> latest = YtDashboardRepository.latestGeneration(rows);

        assertThat(latest).hasSize(2);
        assertThat(latest).allSatisfy(row -> assertThat(row.path("computed_at").asLong()).isEqualTo(1787132036L));
    }

    @Test
    void treatsEmptyTableAsNoGeneration() {
        assertThat(YtDashboardRepository.latestGeneration(List.of())).isEmpty();
    }
}
