package com.skypulse.analytics.api.dto;

import com.skypulse.analytics.model.AirportTrafficReport;
import java.util.List;

public record AirportsTrafficDto(long from, long to, List<AirportTrafficDto> items) {

    public static AirportsTrafficDto from(AirportTrafficReport report) {
        return new AirportsTrafficDto(
                report.window().from(),
                report.window().to(),
                report.airports().stream().map(AirportTrafficDto::from).toList());
    }
}
