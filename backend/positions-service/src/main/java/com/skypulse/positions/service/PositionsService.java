package com.skypulse.positions.service;

import com.skypulse.positions.model.BoundingBox;
import com.skypulse.positions.model.Position;
import com.skypulse.positions.model.TrackPoint;
import com.skypulse.positions.repository.PositionRepository;
import com.skypulse.positions.service.exception.InvalidIcao24Exception;
import com.skypulse.positions.service.exception.InvalidTrackWindowException;
import com.skypulse.positions.service.exception.PositionNotFoundException;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;

@Service
public class PositionsService {

    static final long MAX_TRACK_WINDOW_SECONDS = 86_400L;

    private static final Pattern ICAO24_PATTERN = Pattern.compile("^[0-9a-fA-F]{6}$");

    private final PositionRepository repository;

    public PositionsService(PositionRepository repository) {
        this.repository = repository;
    }

    public List<Position> currentPositions(BoundingBox area) {
        return repository.currentPositions(area);
    }

    public Position latest(String icao24) {
        String code = requireIcao24(icao24);
        return repository.latestByIcao24(code)
                .orElseThrow(() -> new PositionNotFoundException(code));
    }

    public List<TrackPoint> track(String icao24, long sinceSeconds) {
        String code = requireIcao24(icao24);
        // Отрицательное окно снимало отсечку по времени и выгребало всю историю борта.
        if (sinceSeconds < 1 || sinceSeconds > MAX_TRACK_WINDOW_SECONDS) {
            throw new InvalidTrackWindowException(sinceSeconds, MAX_TRACK_WINDOW_SECONDS);
        }
        return repository.historyByIcao24(code, sinceSeconds);
    }

    private static String requireIcao24(String icao24) {
        if (icao24 == null || !ICAO24_PATTERN.matcher(icao24).matches()) {
            throw new InvalidIcao24Exception(icao24);
        }
        return icao24.toLowerCase(Locale.ROOT);
    }
}
