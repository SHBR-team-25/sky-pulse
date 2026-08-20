package com.skypulse.analytics;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.skypulse.analytics.api.StatsController;
import com.skypulse.analytics.model.EmergencyFlight;
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
        StatsEndpointsTest.StubConfig.class})
@TestPropertySource(properties = {
        "skypulse.stats.airport-window-seconds=86400",
        "skypulse.stats.max-position-age-seconds=300"})
class StatsEndpointsTest {

    private static final EmergencyFlight HIJACK = new EmergencyFlight(
            "a981a8", "N711VJ", "7700", 51.2944, 6.7829, false, 1787165695L);

    @TestConfiguration
    static class StubConfig {

        static final AtomicReference<Optional<Long>> NEWEST_EVENT =
                new AtomicReference<>(Optional.of(StubPorts.NEWEST_EVENT_TS));

        static final AtomicReference<List<EmergencyFlight>> EMERGENCIES = new AtomicReference<>(List.of(HIJACK));

        @Bean
        DashboardRepository dashboardRepository() {
            return () -> {
                throw new UnsupportedOperationException("дашборд проверяется отдельным тестом");
            };
        }

        @Bean
        AirportDirectory airportDirectory() {
            return StubPorts.directory();
        }

        @Bean
        AirportEventsRepository airportEventsRepository() {
            return StubPorts.events(NEWEST_EVENT);
        }

        @Bean
        EmergencyRepository emergencyRepository() {
            return StubPorts.emergencies(EMERGENCIES);
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @Test
    void returnsAirportTrafficForLastDayOfData() throws Exception {
        StubConfig.NEWEST_EVENT.set(Optional.of(StubPorts.NEWEST_EVENT_TS));

        mockMvc.perform(get("/api/stats/airports"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.from").value(StubPorts.NEWEST_EVENT_TS - 86400))
                .andExpect(jsonPath("$.to").value(StubPorts.NEWEST_EVENT_TS))
                .andExpect(jsonPath("$.items[0].airport.icao").value("EDDK"))
                .andExpect(jsonPath("$.items[0].airport.name").value("Cologne Bonn Airport"))
                .andExpect(jsonPath("$.items[0].departures").value(13))
                .andExpect(jsonPath("$.items[0].totalFlights24h").value(84));
    }

    // Пустая таблица событий — это «джоба ещё не размечала рейсы», а не «рейсов нет».
    @Test
    void answersServiceUnavailableWhenNoEventsAtAll() throws Exception {
        StubConfig.NEWEST_EVENT.set(Optional.empty());

        mockMvc.perform(get("/api/stats/airports"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.message").isNotEmpty());

        StubConfig.NEWEST_EVENT.set(Optional.of(StubPorts.NEWEST_EVENT_TS));
    }

    @Test
    void fillsHourlyTrafficAcrossWholeWindow() throws Exception {
        mockMvc.perform(get("/api/stats/hourly-traffic"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.points.length()").value(25))
                .andExpect(jsonPath("$.points[0].totalFlights").value(0))
                .andExpect(jsonPath("$.points[24].departures").value(3))
                .andExpect(jsonPath("$.points[24].totalFlights").value(47));
    }

    @Test
    void rejectsMalformedAirportFilter() throws Exception {
        mockMvc.perform(get("/api/stats/hourly-traffic?icao=E'DDK"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    @Test
    void listsEmergencyFlights() throws Exception {
        StubConfig.EMERGENCIES.set(List.of(HIJACK));

        mockMvc.perform(get("/api/stats/emergencies"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.asOf").isNumber())
                .andExpect(jsonPath("$.items[0].icao24").value("a981a8"))
                .andExpect(jsonPath("$.items[0].squawk").value("7700"))
                .andExpect(jsonPath("$.items[0].onGround").value(false));
    }

    // Пустой список — штатный ответ: в небе может не быть ни одного сигнала бедствия.
    @Test
    void returnsEmptyListWhenNobodySquawksEmergency() throws Exception {
        StubConfig.EMERGENCIES.set(List.of());

        mockMvc.perform(get("/api/stats/emergencies"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isEmpty());

        StubConfig.EMERGENCIES.set(List.of(HIJACK));
    }
}
