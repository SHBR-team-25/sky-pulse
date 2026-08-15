package com.skypulse.positions.service;

import com.skypulse.positions.api.dto.BoundingBox;
import com.skypulse.positions.api.dto.PositionDto;
import com.skypulse.positions.api.dto.TrackPointDto;
import com.skypulse.positions.repository.PositionRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class PositionsService {

    private final PositionRepository repository;

    public PositionsService(PositionRepository repository) {
        this.repository = repository;
    }

    public List<PositionDto> currentPositions(BoundingBox area) {
        return repository.currentPositions(area).stream()
                .map(PositionDto::from)
                .toList();
    }

    public PositionDto latest(String icao24) {
        return repository.latestByIcao24(icao24)
                .map(PositionDto::from)
                .orElseThrow(() -> new PositionNotFoundException(icao24));
    }

    public List<TrackPointDto> track(String icao24, long sinceSeconds) {
        return repository.historyByIcao24(icao24, sinceSeconds).stream()
й                .map(p -> new TrackPointDto(p.timePosition(), p.lat(), p.lon(), p.baroAltitude()))
                .toList();
    }
}
