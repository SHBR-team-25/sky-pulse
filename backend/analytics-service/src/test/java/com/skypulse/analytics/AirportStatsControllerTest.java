package com.skypulse.analytics;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.skypulse.analytics.api.AirportsController;
import com.skypulse.analytics.repository.AircraftDirectory;
import com.skypulse.analytics.repository.AirportDirectory;
import com.skypulse.analytics.repository.AirportEventsRepository;
import com.skypulse.analytics.repository.FlightSegmentRepository;
import com.skypulse.analytics.service.FlightLogService;
import com.skypulse.analytics.service.StatsWindows;
import com.skypulse.analytics.service.TrafficStatsService;
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

@WebMvcTest(AirportsController.class)
@Import({TrafficStatsService.class, FlightLogService.class, StatsWindows.class,
        AirportStatsControllerTest.StubConfig.class})
@TestPropertySource(properties = "skypulse.stats.airport-window-seconds=86400")
class AirportStatsControllerTest {

    @TestConfiguration
    static class StubConfig {

        @Bean
        AirportDirectory airportDirectory() {
            return StubPorts.directory();
        }

        @Bean
        AirportEventsRepository airportEventsRepository() {
            return StubPorts.events(new AtomicReference<>(Optional.of(StubPorts.NEWEST_EVENT_TS)));
        }

        @Bean
        FlightSegmentRepository flightSegmentRepository() {
            return StubPorts.segments();
        }

        @Bean
        AircraftDirectory aircraftDirectory() {
            return StubPorts.aircraft();
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @Test
    void returnsFlightsOfSingleAirport() throws Exception {
        mockMvc.perform(get("/api/airports/eddk/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.airport.icao").value("EDDK"))
                .andExpect(jsonPath("$.airport.iata").value("CGN"))
                .andExpect(jsonPath("$.departures").value(13))
                .andExpect(jsonPath("$.arrivals").value(71))
                .andExpect(jsonPath("$.totalFlights24h").value(84))
                .andExpect(jsonPath("$.to").value(StubPorts.NEWEST_EVENT_TS));
    }

    // Опечатка в коде — это 404, а не «аэропорт без рейсов».
    @Test
    void answersNotFoundForUnknownAirport() throws Exception {
        mockMvc.perform(get("/api/airports/ZZZZ/stats"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    @Test
    void rejectsMalformedIcao() throws Exception {
        mockMvc.perform(get("/api/airports/E/stats"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void returnsFlightLogWithCallsignAndAirline() throws Exception {
        mockMvc.perform(get("/api/airports/EDDK/flights"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.airport.icao").value("EDDK"))
                .andExpect(jsonPath("$.items.length()").value(2))
                .andExpect(jsonPath("$.items[0].icao24").value("4bccad"))
                .andExpect(jsonPath("$.items[0].callsign").value("SXS4RX"))
                .andExpect(jsonPath("$.items[0].airlineName").value("SunExpress"))
                .andExpect(jsonPath("$.items[0].direction").value("arrival"))
                .andExpect(jsonPath("$.items[0].otherAirport.icao").value("EDDK"))
                .andExpect(jsonPath("$.items[0].confidence").value(0.91));
    }

    // Борт без записи в справочниках всё равно остаётся в логе (FR4).
    @Test
    void keepsFlightWithoutCallsignAndAirline() throws Exception {
        mockMvc.perform(get("/api/airports/EDDK/flights"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[1].icao24").value("4cace0"))
                .andExpect(jsonPath("$.items[1].callsign").value((Object) null))
                .andExpect(jsonPath("$.items[1].airlineName").value((Object) null))
                .andExpect(jsonPath("$.items[1].otherAirport").value((Object) null));
    }

    @Test
    void filtersFlightLogByDirection() throws Exception {
        mockMvc.perform(get("/api/airports/EDDK/flights?direction=departure"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].direction").value("departure"));
    }

    @Test
    void rejectsUnknownDirection() throws Exception {
        mockMvc.perform(get("/api/airports/EDDK/flights?direction=overflight"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }
}
