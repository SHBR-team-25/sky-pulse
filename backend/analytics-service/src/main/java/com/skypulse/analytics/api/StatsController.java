package com.skypulse.analytics.api;

import com.skypulse.analytics.api.dto.DashboardDto;
import com.skypulse.analytics.service.DashboardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stats")
public class StatsController {

    private final DashboardService service;

    public StatsController(DashboardService service) {
        this.service = service;
    }

    @GetMapping("/dashboard")
    public DashboardDto dashboard(
            @RequestParam(required = false) Long from,
            @RequestParam(required = false) Long to) {
        return DashboardDto.from(service.dashboard(from, to));
    }
}
