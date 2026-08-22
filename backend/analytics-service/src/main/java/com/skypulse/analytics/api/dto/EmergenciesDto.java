package com.skypulse.analytics.api.dto;

import com.skypulse.analytics.model.Emergencies;
import java.util.List;

public record EmergenciesDto(long asOf, List<EmergencyFlightDto> items) {

    public static EmergenciesDto from(Emergencies emergencies) {
        return new EmergenciesDto(
                emergencies.asOf(),
                emergencies.flights().stream().map(EmergencyFlightDto::from).toList());
    }
}
