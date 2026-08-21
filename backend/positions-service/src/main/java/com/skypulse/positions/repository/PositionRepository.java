package com.skypulse.positions.repository;

import com.skypulse.positions.model.BoundingBox;
import com.skypulse.positions.model.Position;
import com.skypulse.positions.model.TrackPoint;
import java.util.List;
import java.util.Optional;

public interface PositionRepository {

    List<Position> currentPositions(BoundingBox area);

    Optional<Position> latestByIcao24(String icao24);

    List<TrackPoint> historyByIcao24(String icao24, long sinceSeconds);
}
