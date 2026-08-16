package com.skypulse.positions.repository;

import com.skypulse.positions.api.dto.BoundingBox;
import com.skypulse.positions.model.Position;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

@Repository
@Profile("!yt")
public class InMemoryPositionRepository implements PositionRepository {

    private static final Position SAMPLE = new Position(
            "abc123",
            "SVR1234",
            "Russia",
            Instant.now().getEpochSecond(),
            55.75,
            37.62,
            10600.0,
            false,
            240.0,
            92.0,
            "Airbus",
            "A320",
            "Some Airline"
    );

    @Override
    public List<Position> currentPositions(BoundingBox area) {
        if (area == null || area.contains(SAMPLE.lat(), SAMPLE.lon())) {
            return List.of(SAMPLE);
        }
        return List.of();
    }

    @Override
    public Optional<Position> latestByIcao24(String icao24) {
        return SAMPLE.icao24().equals(icao24) ? Optional.of(SAMPLE) : Optional.empty();
    }

    @Override
    public List<Position> historyByIcao24(String icao24, long sinceSeconds) {
        return latestByIcao24(icao24).map(List::of).orElseGet(List::of);
    }
}
