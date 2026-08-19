package com.skypulse.analytics;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.skypulse.analytics.api.StatsController;
import com.skypulse.analytics.model.AirportTraffic;
import com.skypulse.analytics.model.DashboardSnapshot;
import com.skypulse.analytics.model.FlightsByPhase;
import com.skypulse.analytics.model.Totals;
import com.skypulse.analytics.model.TrafficPoint;
import com.skypulse.analytics.repository.DashboardRepository;
import com.skypulse.analytics.service.DashboardService;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(StatsController.class)
@Import({DashboardService.class, StatsControllerTest.StubRepositoryConfig.class})
@TestPropertySource(properties = "skypulse.stats.default-window-seconds=86400")
class StatsControllerTest {

    @TestConfiguration
    static class StubRepositoryConfig {

        @Bean
        DashboardRepository dashboardRepository() {
            return window -> new DashboardSnapshot(
                    window,
                    new Totals(2, 1, 9000.0, 800.0),
                    new FlightsByPhase(1, 0, 0, 1),
                    List.of(new AirportTraffic("UUEE", "Sheremetyevo", 5)),
                    List.of(new TrafficPoint(window.to(), 2)),
                    0);
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @Test
    void returnsDashboardForRequestedWindow() throws Exception {
        mockMvc.perform(get("/api/stats/dashboard?from=100&to=200"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.from").value(100))
                .andExpect(jsonPath("$.to").value(200))
                .andExpect(jsonPath("$.totals.activeFlights").value(2))
                .andExpect(jsonPath("$.flightsByPhase.on_ground").value(1))
                .andExpect(jsonPath("$.topBusiestAirports[0].airport.icao").value("UUEE"))
                .andExpect(jsonPath("$.trafficTrend[0].activeFlights").value(2))
                .andExpect(jsonPath("$.emergencyCount").value(0));
    }

    @Test
    void fallsBackToDefaultWindowWhenBoundsMissing() throws Exception {
        mockMvc.perform(get("/api/stats/dashboard"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.from").isNumber())
                .andExpect(jsonPath("$.to").isNumber());
    }
}
