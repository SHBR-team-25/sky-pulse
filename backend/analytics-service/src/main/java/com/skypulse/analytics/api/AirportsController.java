package com.skypulse.analytics.api;

import com.skypulse.analytics.api.dto.AirportStatsDto;
import com.skypulse.analytics.service.TrafficStatsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/airports")
public class AirportsController {

    private final TrafficStatsService service;

    public AirportsController(TrafficStatsService service) {
        this.service = service;
    }

    @GetMapping("/{icao}/stats")
    public AirportStatsDto stats(@PathVariable String icao) {
        return AirportStatsDto.from(service.airport(icao));
    }
}
