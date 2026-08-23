package com.skypulse.analytics.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.skypulse.analytics.model.DashboardSnapshot;
import com.skypulse.analytics.model.FlightsByPhase;
import com.skypulse.analytics.model.Totals;
import com.skypulse.analytics.repository.exception.DataSourceUnavailableException;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;

class CachedDashboardRepositoryTest {

    private final AtomicInteger reads = new AtomicInteger();
    private final AtomicReference<DashboardSnapshot> ytAnswer = new AtomicReference<>();

    /** null в ответе YT означает сбой источника: так ведёт себя чтение упавшей таблицы. */
    private final DashboardRepository yt = () -> {
        reads.incrementAndGet();
        DashboardSnapshot answer = ytAnswer.get();
        if (answer == null) {
            throw new DataSourceUnavailableException("YT недоступен");
        }
        return answer;
    };

    private final CachedDashboardRepository repository = new CachedDashboardRepository(yt);

    private static DashboardSnapshot snapshot(long computedAt) {
        return new DashboardSnapshot(
                computedAt,
                new Totals(917, 38, 9412.5, 221.4),
                new FlightsByPhase(120, 797, 210, 180),
                List.of(), List.of(), List.of(), List.of(), List.of(), List.of(), 0);
    }

    // Ради этого кэш и заводился: запрос клиента не должен ходить в YT вообще.
    @Test
    void servesSnapshotWithoutTouchingYt() {
        ytAnswer.set(snapshot(1787132036L));
        repository.refresh();
        int readsAfterRefresh = reads.get();

        for (int i = 0; i < 5; i++) {
            assertThat(repository.latest().computedAt()).isEqualTo(1787132036L);
        }

        assertThat(reads.get()).isEqualTo(readsAfterRefresh);
    }

    @Test
    void keepsLastGoodSnapshotWhenYtFails() {
        ytAnswer.set(snapshot(1787132036L));
        repository.refresh();

        ytAnswer.set(null);
        repository.refresh();

        assertThat(repository.latest().computedAt()).isEqualTo(1787132036L);
    }

    @Test
    void picksUpNewGenerationOnNextRefresh() {
        ytAnswer.set(snapshot(1787132036L));
        repository.refresh();

        ytAnswer.set(snapshot(1787132336L));
        repository.refresh();

        assertThat(repository.latest().computedAt()).isEqualTo(1787132336L);
    }

    // Пока джоба не отработала, отдавать нечего — только 503.
    @Test
    void failsUntilFirstSuccessfulRefresh() {
        assertThatThrownBy(repository::latest).isInstanceOf(DataSourceUnavailableException.class);

        ytAnswer.set(null);
        repository.refresh();

        assertThatThrownBy(repository::latest).isInstanceOf(DataSourceUnavailableException.class);
    }
}
