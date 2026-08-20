package com.skypulse.analytics;

import static org.hamcrest.Matchers.closeTo;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.skypulse.analytics.api.StatsController;
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
import com.skypulse.analytics.repository.AirportDirectory;
import com.skypulse.analytics.repository.AirportEventsRepository;
import com.skypulse.analytics.repository.DashboardRepository;
import com.skypulse.analytics.repository.EmergencyRepository;
import com.skypulse.analytics.service.DashboardService;
import com.skypulse.analytics.service.EmergencyService;
import com.skypulse.analytics.service.TrafficStatsService;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(StatsController.class)
@Import({DashboardService.class, TrafficStatsService.class, EmergencyService.class,
        StatsControllerTest.StubRepositoryConfig.class})
@TestPropertySource(properties = {
        "skypulse.stats.airport-window-seconds=86400",
        "skypulse.stats.max-position-age-seconds=300"})
class StatsControllerTest {

    private static final AirportRef KOELN = new AirportRef("EDDK", "CGN", "Cologne Bonn Airport");

    private static DashboardSnapshot snapshot(Totals totals) {
        return new DashboardSnapshot(
                1787132036L,
                totals,
                new FlightsByPhase(120, 797, 210, 180),
                List.of(new AirportTraffic(KOELN, 12, 64, 76)),
                List.of(new RouteTraffic(KOELN, KOELN, 5)),
                List.of(new ManufacturerShare("Boeing", 232)),
                List.of(new CountryShare("Germany", 1035)),
                List.of(new AirlineShare("Ryanair", 214)),
                List.of(new TrafficPoint(1787132036L, 917)),
                0);
    }

    @TestConfiguration
    static class StubRepositoryConfig {

        static final AtomicReference<DashboardSnapshot> LATEST =
                new AtomicReference<>(snapshot(new Totals(917, 38, 9412.5, 221.4)));

        @Bean
        DashboardRepository dashboardRepository() {
            return LATEST::get;
        }

        // Ручки трафика и аварийных бортов проверяются в StatsEndpointsTest,
        // здесь их порты нужны только чтобы контекст поднялся.
        @Bean
        AirportDirectory airportDirectory() {
            return StubPorts.directory();
        }

        @Bean
        AirportEventsRepository airportEventsRepository() {
            return StubPorts.events(new AtomicReference<>(Optional.of(StubPorts.NEWEST_EVENT_TS)));
        }

        @Bean
        EmergencyRepository emergencyRepository() {
            return StubPorts.emergencies(new AtomicReference<>(List.of()));
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @Test
    void returnsLatestSnapshot() throws Exception {
        StubRepositoryConfig.LATEST.set(snapshot(new Totals(917, 38, 9412.5, 221.4)));

        mockMvc.perform(get("/api/stats/dashboard"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.computedAt").value(1787132036L))
                .andExpect(jsonPath("$.totals.activeFlights").value(917))
                .andExpect(jsonPath("$.totals.averageSpeedKmh").value(closeTo(797.04, 1e-6)))
                .andExpect(jsonPath("$.flightsByPhase.airborne").value(797))
                .andExpect(jsonPath("$.topBusiestAirports[0].airport.iata").value("CGN"))
                .andExpect(jsonPath("$.topBusiestAirports[0].arrivals").value(64))
                .andExpect(jsonPath("$.busiestRoutes[0].flightCount").value(5))
                .andExpect(jsonPath("$.aircraftByManufacturer[0].manufacturer").value("Boeing"))
                .andExpect(jsonPath("$.topCountries[0].country").value("Germany"))
                .andExpect(jsonPath("$.topCountries[0].flightCount").value(1035))
                .andExpect(jsonPath("$.topAirlines[0].airline").value("Ryanair"))
                .andExpect(jsonPath("$.trafficTrend[0].activeFlights").value(917))
                .andExpect(jsonPath("$.emergencyCount").value(0));
    }

    // Средние в dashboard_totals nullable: ноль означал бы «летели на уровне моря».
    @Test
    void keepsMissingAveragesNull() throws Exception {
        StubRepositoryConfig.LATEST.set(snapshot(new Totals(0, 38, null, null)));

        mockMvc.perform(get("/api/stats/dashboard"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totals.averageAltitudeM").value((Object) null))
                .andExpect(jsonPath("$.totals.averageSpeedKmh").value((Object) null));
    }
}
