package com.skypulse.positions.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.skypulse.positions.model.BoundingBox;
import com.skypulse.positions.model.Position;
import com.skypulse.positions.model.TrackPoint;
import com.skypulse.positions.repository.exception.DataSourceUnavailableException;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;

class CachedPositionRepositoryTest {

    private static final long NOW = 1787132036L;
    private static final long MAX_POSITION_AGE_SECONDS = 300L;
    private static final long REFRESH_SECONDS = 5L;

    private static final BoundingBox AREA = new BoundingBox(20.0, 45.0, 40.0, 60.0);

    private final AtomicInteger reads = new AtomicInteger();
    private final AtomicLong queriedFrom = new AtomicLong();
    private final AtomicReference<List<Position>> ytAnswer = new AtomicReference<>(List.of());
    private final AtomicReference<Instant> now = new AtomicReference<>(Instant.ofEpochSecond(NOW));

    private final Clock clock = new Clock() {

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return now.get();
        }
    };

    private final PositionSnapshotSource yt = new PositionSnapshotSource() {

        @Override
        public List<Position> positionsSince(long timePositionFrom) {
            queriedFrom.set(timePositionFrom);
            return rows().stream().filter(position -> position.timePosition() >= timePositionFrom).toList();
        }

        @Override
        public List<Position> currentPositions(BoundingBox area) {
            return positionsSince(now.get().getEpochSecond() - MAX_POSITION_AGE_SECONDS).stream()
                    .filter(position -> area == null || area.contains(position.lat(), position.lon()))
                    .toList();
        }

        // Как в YT: latest ходит в positions_current без отсечки по свежести.
        @Override
        public Optional<Position> latestByIcao24(String icao24) {
            return rows().stream().filter(position -> position.icao24().equals(icao24)).findFirst();
        }

        @Override
        public List<TrackPoint> historyByIcao24(String icao24, long sinceSeconds) {
            return List.of();
        }

        private List<Position> rows() {
            reads.incrementAndGet();
            List<Position> answer = ytAnswer.get();
            if (answer == null) {
                throw new DataSourceUnavailableException("YT недоступен");
            }
            return answer;
        }
    };

    private final CachedPositionRepository repository =
            new CachedPositionRepository(yt, clock, MAX_POSITION_AGE_SECONDS, REFRESH_SECONDS);

    private static Position position(String icao24, long timePosition, double lat, double lon) {
        return new Position(icao24, "SVR1234", "Russia", timePosition, lat, lon,
                10600.0, false, 240.0, 92.0, "Airbus", "A320", "Some Airline");
    }

    private static List<String> icao24Of(List<Position> positions) {
        return positions.stream().map(Position::icao24).toList();
    }

    // Границы включаются, как включал их QL-оператор between.
    @Test
    void filtersByBoundingBoxLikeQueryLanguageDid() {
        ytAnswer.set(List.of(
                position("0000a1", NOW - 10, 55.75, 37.62),
                position("0000a2", NOW - 10, 45.0, 20.0),
                position("0000a3", NOW - 10, 60.0, 40.0),
                position("0000b1", NOW - 10, 44.9, 30.0),
                position("0000b2", NOW - 10, 60.1, 30.0),
                position("0000b3", NOW - 10, 50.0, 19.9),
                position("0000b4", NOW - 10, 50.0, 40.1)));
        repository.refresh();

        assertThat(icao24Of(repository.currentPositions(AREA)))
                .containsExactlyInAnyOrder("0000a1", "0000a2", "0000a3");
        assertThat(icao24Of(repository.currentPositions(null))).hasSize(7);
    }

    @Test
    void readsSnapshotWithSlackOverFreshnessCutoff() {
        repository.refresh();

        assertThat(queriedFrom.get()).isEqualTo(NOW - MAX_POSITION_AGE_SECONDS - REFRESH_SECONDS);
    }

    @Test
    void movesFreshnessCutoffBetweenRefreshes() {
        ytAnswer.set(List.of(
                position("00beef", NOW - 10, 55.75, 37.62),
                position("00fade", NOW - 290, 55.75, 37.62)));
        repository.refresh();
        final int readsAfterRefresh = reads.get();

        assertThat(icao24Of(repository.currentPositions(null))).containsExactlyInAnyOrder("00beef", "00fade");

        now.set(Instant.ofEpochSecond(NOW + 20));

        assertThat(icao24Of(repository.currentPositions(null))).containsExactly("00beef");
        assertThat(reads.get()).isEqualTo(readsAfterRefresh);
    }

    @Test
    void keepsPreviousSnapshotWhenYtFails() {
        ytAnswer.set(List.of(position("00beef", NOW - 10, 55.75, 37.62)));
        repository.refresh();

        ytAnswer.set(null);
        repository.refresh();

        assertThat(icao24Of(repository.currentPositions(AREA))).containsExactly("00beef");
    }

    @Test
    void servesRepeatedRequestsWithoutTouchingYt() {
        ytAnswer.set(List.of(position("00beef", NOW - 10, 55.75, 37.62)));
        repository.refresh();
        int readsAfterRefresh = reads.get();

        for (int i = 0; i < 5; i++) {
            assertThat(repository.currentPositions(new BoundingBox(i, 45.0, 40.0, 60.0))).isNotNull();
            assertThat(repository.currentPositions(null)).hasSize(1);
        }

        assertThat(reads.get()).isEqualTo(readsAfterRefresh);
    }

    @Test
    void readsThroughToYtUntilFirstRefresh() {
        ytAnswer.set(List.of(position("00beef", NOW - 10, 55.75, 37.62)));

        assertThat(icao24Of(repository.currentPositions(AREA))).containsExactly("00beef");
        assertThat(reads.get()).isEqualTo(1);
    }

    @Test
    void servesAirborneAircraftFromSnapshot() {
        ytAnswer.set(List.of(position("00beef", NOW - 10, 55.75, 37.62)));
        repository.refresh();
        int readsAfterRefresh = reads.get();

        assertThat(repository.latestByIcao24("00beef")).map(Position::icao24).contains("00beef");
        assertThat(reads.get()).isEqualTo(readsAfterRefresh);
    }

    // Севший борт выпал из снапшота по свежести, но 404 вместо его последней позиции
    // был бы сменой поведения эндпоинта /api/flights/{icao24}.
    @Test
    void asksYtForAircraftMissingFromSnapshot() {
        ytAnswer.set(List.of(
                position("00beef", NOW - 10, 55.75, 37.62),
                position("00dead", NOW - 10_000, 55.75, 37.62)));
        repository.refresh();
        int readsAfterRefresh = reads.get();

        assertThat(repository.latestByIcao24("00dead")).map(Position::icao24).contains("00dead");
        assertThat(reads.get()).isEqualTo(readsAfterRefresh + 1);
    }
}
