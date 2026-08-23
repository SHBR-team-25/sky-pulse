package com.skypulse.positions.repository;

import com.skypulse.positions.model.Position;
import java.util.List;

public interface PositionSnapshotSource extends PositionRepository {

    List<Position> positionsSince(long timePositionFrom);
}
