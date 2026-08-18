package com.skypulse.positions.api;

import com.skypulse.positions.api.dto.AirportsListResponse;
import com.skypulse.positions.api.dto.AirportsQuery;
import com.skypulse.positions.api.dto.BoundingBox;
import com.skypulse.positions.service.AirportsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/airports")
public class AirportsController {

    private final AirportsService service;

    public AirportsController(AirportsService service) {
        this.service = service;
    }

    @GetMapping
    public AirportsListResponse list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String country,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer pageSize,
            @RequestParam(required = false) Double lonMin,
            @RequestParam(required = false) Double latMin,
            @RequestParam(required = false) Double lonMax,
            @RequestParam(required = false) Double latMax,
            @RequestParam(required = false) Integer limit) {
        BoundingBox area = null;
        if (lonMin != null && latMin != null && lonMax != null && latMax != null) {
            area = new BoundingBox(lonMin, latMin, lonMax, latMax);
        }
        return service.list(new AirportsQuery(search, country, sortBy, area, page, pageSize, limit));
    }
}
