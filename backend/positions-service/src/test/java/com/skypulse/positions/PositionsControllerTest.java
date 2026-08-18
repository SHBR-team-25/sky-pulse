package com.skypulse.positions;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.skypulse.positions.api.PositionsController;
import com.skypulse.positions.repository.InMemoryPositionRepository;
import com.skypulse.positions.service.PositionsService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(PositionsController.class)
@Import({PositionsService.class, InMemoryPositionRepository.class})
class PositionsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void returnsCurrentPositions() throws Exception {
        mockMvc.perform(get("/api/positions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].icao24").value("abc123"))
                .andExpect(jsonPath("$[0].originCountry").value("Russia"))
                .andExpect(jsonPath("$[0].baroAltitude").value(10600.0))
                .andExpect(jsonPath("$[0].manufacturername").value("Airbus"))
                .andExpect(jsonPath("$[0].model").value("A320"));
    }

    @Test
    void returnsLatestByIcao24() throws Exception {
        mockMvc.perform(get("/api/positions/abc123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.callsign").value("SVR1234"))
                .andExpect(jsonPath("$.trueTrack").value(92.0))
                .andExpect(jsonPath("$.model").value("A320"));
    }

    @Test
    void returns404ForUnknownAircraft() throws Exception {
        mockMvc.perform(get("/api/positions/unknown"))
                .andExpect(status().isNotFound());
    }
}
