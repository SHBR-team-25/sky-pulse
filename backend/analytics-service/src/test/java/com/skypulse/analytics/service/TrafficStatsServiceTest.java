package com.skypulse.analytics.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.skypulse.analytics.model.HourPoint;
import com.skypulse.analytics.model.StatsWindow;
import java.util.List;
import org.junit.jupiter.api.Test;

class TrafficStatsServiceTest {

    // Часы без рейсов должны прийти нулями, иначе на графике рвётся ось времени.
    @Test
    void fillsHoursWithoutEventsWithZeroes() {
        List<HourPoint> filled = TrafficStatsService.fillGaps(
                List.of(new HourPoint(1787130000L, 41, 194)),
                new StatsWindow(1787126400L, 1787133600L));

        assertThat(filled).containsExactly(
                new HourPoint(1787126400L, 0, 0),
                new HourPoint(1787130000L, 41, 194),
                new HourPoint(1787133600L, 0, 0));
    }

    // Границы окна почти никогда не попадают ровно на начало часа.
    @Test
    void alignsWindowBoundsToWholeHours() {
        List<HourPoint> filled = TrafficStatsService.fillGaps(List.of(), new StatsWindow(1787127000L, 1787131500L));

        assertThat(filled).extracting(HourPoint::hour).containsExactly(1787126400L, 1787130000L);
    }
}
