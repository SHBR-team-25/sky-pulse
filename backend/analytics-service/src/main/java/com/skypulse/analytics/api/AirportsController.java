package com.skypulse.analytics.api;

import com.skypulse.analytics.api.dto.AirportFlightsDto;
import com.skypulse.analytics.api.dto.AirportStatsDto;
import com.skypulse.analytics.service.FlightLogService;
import com.skypulse.analytics.service.TrafficStatsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/airports")
public class AirportsController {

    private final TrafficStatsService trafficStatsService;
    private final FlightLogService flightLogService;

    public AirportsController(TrafficStatsService trafficStatsService, FlightLogService flightLogService) {
        this.trafficStatsService = trafficStatsService;
        this.flightLogService = flightLogService;
    }

    @GetMapping("/{icao}/stats")
    public AirportStatsDto stats(@PathVariable String icao) {
        return AirportStatsDto.from(trafficStatsService.airport(icao));
    }

    @GetMapping("/{icao}/flights")
    public AirportFlightsDto flights(
            @PathVariable String icao,
            @RequestParam(required = false) String direction) {
        return AirportFlightsDto.from(flightLogService.log(icao, direction));
    }
}
