package com.skypulse.positions.api;

import com.skypulse.positions.api.dto.BoundingBox;
import com.skypulse.positions.api.dto.PositionDto;
import com.skypulse.positions.api.dto.TrackPointDto;
import com.skypulse.positions.service.PositionsService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/flights")
public class FlightsController {

    private static final long DEFAULT_TRACK_WINDOW_SECONDS = 3600L;

    private final PositionsService service;

    public FlightsController(PositionsService service) {
        this.service = service;
    }

    @GetMapping("/live")
    public List<PositionDto> live(
            @RequestParam(required = false) Double minLat,
            @RequestParam(required = false) Double minLon,
            @RequestParam(required = false) Double maxLat,
            @RequestParam(required = false) Double maxLon) {
        BoundingBox area = null;
        if (minLat != null && minLon != null && maxLat != null && maxLon != null) {
            area = new BoundingBox(minLat, minLon, maxLat, maxLon);
        }
        return service.currentPositions(area);
    }

    @GetMapping("/{icao24}")
    public PositionDto latest(@PathVariable String icao24) {
        return service.latest(icao24);
    }

    @GetMapping("/{icao24}/track")
    public List<TrackPointDto> track(
            @PathVariable String icao24,
            @RequestParam(defaultValue = "" + DEFAULT_TRACK_WINDOW_SECONDS) long sinceSeconds) {
        return service.track(icao24, sinceSeconds);
    }
}
