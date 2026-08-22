package com.skypulse.analytics.api.dto;

import com.skypulse.analytics.model.HourlyTraffic;
import java.util.List;

public record HourlyTrafficDto(long from, long to, List<HourPointDto> points) {

    public static HourlyTrafficDto from(HourlyTraffic traffic) {
        return new HourlyTrafficDto(
                traffic.window().from(),
                traffic.window().to(),
                traffic.points().stream().map(HourPointDto::from).toList());
    }
}
