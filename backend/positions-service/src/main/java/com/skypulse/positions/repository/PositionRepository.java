package com.skypulse.positions.repository;

import com.skypulse.positions.api.dto.BoundingBox;
import com.skypulse.positions.model.Position;
import java.util.List;
import java.util.Optional;

public interface PositionRepository {

    List<Position> currentPositions(BoundingBox area);

    Optional<Position> latestByIcao24(String icao24);

    List<Position> historyByIcao24(String icao24, long sinceSeconds);
}
