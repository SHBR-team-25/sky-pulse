package com.skypulse.positions.service;

import com.skypulse.positions.model.BoundingBox;
import com.skypulse.positions.model.Position;
import com.skypulse.positions.model.TrackPoint;
import com.skypulse.positions.repository.PositionRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class PositionsService {

    private final PositionRepository repository;

    public PositionsService(PositionRepository repository) {
        this.repository = repository;
    }

    public List<Position> currentPositions(BoundingBox area) {
        return repository.currentPositions(area);
    }

    public Position latest(String icao24) {
        return repository.latestByIcao24(icao24)
                .orElseThrow(() -> new PositionNotFoundException(icao24));
    }

    public List<TrackPoint> track(String icao24, long sinceSeconds) {
        return repository.historyByIcao24(icao24, sinceSeconds);
    }
}
