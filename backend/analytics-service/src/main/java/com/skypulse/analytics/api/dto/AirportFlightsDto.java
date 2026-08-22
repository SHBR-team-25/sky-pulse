package com.skypulse.analytics.api.dto;

import com.skypulse.analytics.model.AirportFlightLog;
import java.util.List;

public record AirportFlightsDto(
        long from,
        long to,
        AirportRefDto airport,
        List<FlightLogEntryDto> items
) {

    public static AirportFlightsDto from(AirportFlightLog log) {
        return new AirportFlightsDto(
                log.window().from(),
                log.window().to(),
                AirportRefDto.from(log.airport()),
                log.flights().stream().map(FlightLogEntryDto::from).toList());
    }
}
