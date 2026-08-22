package com.skypulse.analytics.api;

import com.skypulse.analytics.api.dto.AirportsTrafficDto;
import com.skypulse.analytics.api.dto.DashboardDto;
import com.skypulse.analytics.api.dto.EmergenciesDto;
import com.skypulse.analytics.api.dto.HourlyTrafficDto;
import com.skypulse.analytics.service.DashboardService;
import com.skypulse.analytics.service.EmergencyService;
import com.skypulse.analytics.service.TrafficStatsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stats")
public class StatsController {

    private final DashboardService dashboardService;
    private final TrafficStatsService trafficStatsService;
    private final EmergencyService emergencyService;

    public StatsController(
            DashboardService dashboardService,
            TrafficStatsService trafficStatsService,
            EmergencyService emergencyService) {
        this.dashboardService = dashboardService;
        this.trafficStatsService = trafficStatsService;
        this.emergencyService = emergencyService;
    }

    // Параметров нет: в YT лежит один снапшот, попросить произвольный период нечем.
    @GetMapping("/dashboard")
    public DashboardDto dashboard() {
        return DashboardDto.from(dashboardService.dashboard());
    }

    @GetMapping("/airports")
    public AirportsTrafficDto airports() {
        return AirportsTrafficDto.from(trafficStatsService.airports());
    }

    @GetMapping("/hourly-traffic")
    public HourlyTrafficDto hourlyTraffic(@RequestParam(required = false) String icao) {
        return HourlyTrafficDto.from(trafficStatsService.hourly(icao));
    }

    @GetMapping("/emergencies")
    public EmergenciesDto emergencies() {
        return EmergenciesDto.from(emergencyService.current());
    }
}
