package com.skypulse.analytics.repository;

import com.fasterxml.jackson.databind.JsonNode;
import com.skypulse.analytics.model.AirlineShare;
import com.skypulse.analytics.model.AirportRef;
import com.skypulse.analytics.model.AirportTraffic;
import com.skypulse.analytics.model.CountryShare;
import com.skypulse.analytics.model.DashboardSnapshot;
import com.skypulse.analytics.model.FlightsByPhase;
import com.skypulse.analytics.model.ManufacturerShare;
import com.skypulse.analytics.model.RouteTraffic;
import com.skypulse.analytics.model.Totals;
import com.skypulse.analytics.model.TrafficPoint;
import com.skypulse.analytics.repository.exception.DataSourceUnavailableException;
import java.util.Comparator;
import java.util.List;
import java.util.function.Function;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;

/**
 * Собирает снапшот дашборда: агрегаты берутся из готовых таблиц dashboard_*,
 * которые считает SPYT-джоба, а разрезы по странам и авиакомпаниям — запросом
 * по positions_current, отдельной таблицы под них нет.
 */
@Repository
public class YtDashboardRepository implements DashboardRepository {

    private static final Logger LOG = LoggerFactory.getLogger(YtDashboardRepository.class);

    private final YtQueryClient ytQueryClient;
    private final AirportDirectory airports;
    private final String totalsPath;
    private final String trendPath;
    private final String topAirportsPath;
    private final String routesPath;
    private final String manufacturersPath;
    private final String positionsCurrentPath;
    private final int topLimit;
    private final int trendLimit;

    public YtDashboardRepository(
            YtQueryClient ytQueryClient,
            AirportDirectory airports,
            @Value("${skypulse.yt.dashboard-totals-path}") String totalsPath,
            @Value("${skypulse.yt.dashboard-trend-path}") String trendPath,
            @Value("${skypulse.yt.dashboard-top-airports-path}") String topAirportsPath,
            @Value("${skypulse.yt.dashboard-routes-path}") String routesPath,
            @Value("${skypulse.yt.dashboard-manufacturers-path}") String manufacturersPath,
            @Value("${skypulse.yt.positions-current-path}") String positionsCurrentPath,
            @Value("${skypulse.stats.top-limit}") int topLimit,
            @Value("${skypulse.stats.trend-limit}") int trendLimit) {
        this.ytQueryClient = ytQueryClient;
        this.airports = airports;
        this.totalsPath = totalsPath;
        this.trendPath = trendPath;
        this.topAirportsPath = topAirportsPath;
        this.routesPath = routesPath;
        this.manufacturersPath = manufacturersPath;
        this.positionsCurrentPath = positionsCurrentPath;
        this.topLimit = topLimit;
        this.trendLimit = trendLimit;
    }

    @Override
    public DashboardSnapshot latest() {
        JsonNode totals = latestGeneration(ytQueryClient.readTable(totalsPath)).stream()
                .findFirst()
                .orElseThrow(() -> new DataSourceUnavailableException(
                        "Таблица агрегатов пуста: джоба ещё ни разу не посчитала дашборд"));
        return new DashboardSnapshot(
                YtRow.requiredLong(totals, "computed_at"),
                toTotals(totals),
                toPhases(totals),
                topBusiestAirports(),
                busiestRoutes(),
                aircraftByManufacturer(),
                topCountries(),
                topAirlines(),
                trafficTrend(),
                (int) YtRow.requiredLong(totals, "emergency_squawks"));
    }

    private List<AirportTraffic> topBusiestAirports() {
        return YtRow.mapSkippingBroken(
                        latestGeneration(ytQueryClient.readTable(topAirportsPath)),
                        row -> toAirportTraffic(row, airports::byIcao), LOG).stream()
                .sorted(Comparator.comparingInt(AirportTraffic::totalFlights).reversed())
                .toList();
    }

    private List<RouteTraffic> busiestRoutes() {
        return YtRow.mapSkippingBroken(
                        latestGeneration(ytQueryClient.readTable(routesPath)),
                        row -> toRoute(row, airports::byIcao), LOG).stream()
                .sorted(Comparator.comparingInt(RouteTraffic::flightCount).reversed())
                .toList();
    }

    private List<ManufacturerShare> aircraftByManufacturer() {
        return YtRow.mapSkippingBroken(
                        latestGeneration(ytQueryClient.readTable(manufacturersPath)),
                        YtDashboardRepository::toManufacturer, LOG).stream()
                .sorted(Comparator.comparingInt(ManufacturerShare::flightCount).reversed())
                .toList();
    }

    private List<CountryShare> topCountries() {
        String query = """
                origin_country as country, sum(1) as flight_count from [%s] \
                where not is_null(origin_country) group by origin_country \
                order by flight_count desc limit %d"""
                .formatted(positionsCurrentPath, topLimit);
        return YtRow.mapSkippingBroken(
                ytQueryClient.selectRows(query), YtDashboardRepository::toCountry, LOG);
    }

    private List<AirlineShare> topAirlines() {
        // Борта без operator отбрасываются: справочник покрывает шестую часть парка,
        // и общая категория «Unknown» перевесила бы все настоящие авиакомпании.
        String query = """
                operator as airline, sum(1) as flight_count from [%s] \
                where not is_null(operator) group by operator \
                order by flight_count desc limit %d"""
                .formatted(positionsCurrentPath, topLimit);
        return YtRow.mapSkippingBroken(
                ytQueryClient.selectRows(query), YtDashboardRepository::toAirline, LOG);
    }

    private List<TrafficPoint> trafficTrend() {
        // Свежие точки нужны сверху, а клиенту тренд отдаётся по возрастанию времени.
        String query = "computed_at, active_aircraft from [%s] order by computed_at desc limit %d"
                .formatted(trendPath, trendLimit);
        return YtRow.mapSkippingBroken(
                        ytQueryClient.selectRows(query), YtDashboardRepository::toTrendPoint, LOG).stream()
                .sorted(Comparator.comparingLong(TrafficPoint::timestamp))
                .toList();
    }

    /**
     * Строки последнего пересчёта. Джоба перезаписывает таблицы целиком, но если
     * она когда-нибудь начнёт дописывать, смешать в одном ответе разные поколения
     * агрегатов нельзя — числа перестанут сходиться между собой.
     */
    static List<JsonNode> latestGeneration(List<JsonNode> rows) {
        long newest = rows.stream()
                .mapToLong(row -> row.path("computed_at").asLong(Long.MIN_VALUE))
                .max()
                .orElse(Long.MIN_VALUE);
        return rows.stream()
                .filter(row -> row.path("computed_at").asLong(Long.MIN_VALUE) == newest)
                .toList();
    }

    static Totals toTotals(JsonNode row) {
        return new Totals(
                (int) YtRow.requiredLong(row, "active_flights"),
                (int) YtRow.requiredLong(row, "tracked_airports"),
                YtRow.nullableDouble(row, "avg_altitude_m"),
                YtRow.nullableDouble(row, "avg_velocity_mps"));
    }

    static FlightsByPhase toPhases(JsonNode row) {
        return new FlightsByPhase(
                (int) YtRow.requiredLong(row, "on_ground"),
                (int) YtRow.requiredLong(row, "airborne"),
                (int) YtRow.requiredLong(row, "climbing"),
                (int) YtRow.requiredLong(row, "descending"));
    }

    static AirportTraffic toAirportTraffic(JsonNode row, Function<String, AirportRef> lookup) {
        return new AirportTraffic(
                lookup.apply(YtRow.requiredText(row, "airport_icao")),
                (int) YtRow.requiredLong(row, "departures"),
                (int) YtRow.requiredLong(row, "arrivals"),
                (int) YtRow.requiredLong(row, "total_flights"));
    }

    static RouteTraffic toRoute(JsonNode row, Function<String, AirportRef> lookup) {
        return new RouteTraffic(
                lookup.apply(YtRow.requiredText(row, "departure_icao")),
                lookup.apply(YtRow.requiredText(row, "arrival_icao")),
                (int) YtRow.requiredLong(row, "flight_count"));
    }

    static ManufacturerShare toManufacturer(JsonNode row) {
        return new ManufacturerShare(
                YtRow.requiredText(row, "manufacturer"),
                (int) YtRow.requiredLong(row, "flight_count"));
    }

    static CountryShare toCountry(JsonNode row) {
        return new CountryShare(
                YtRow.requiredText(row, "country"),
                (int) YtRow.requiredLong(row, "flight_count"));
    }

    static AirlineShare toAirline(JsonNode row) {
        return new AirlineShare(
                YtRow.requiredText(row, "airline"),
                (int) YtRow.requiredLong(row, "flight_count"));
    }

    static TrafficPoint toTrendPoint(JsonNode row) {
        return new TrafficPoint(
                YtRow.requiredLong(row, "computed_at"),
                (int) YtRow.requiredLong(row, "active_aircraft"));
    }
}
