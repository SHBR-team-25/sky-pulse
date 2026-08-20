package com.skypulse.analytics.api.dto;

import com.skypulse.analytics.model.AirlineShare;

public record AirlineShareDto(String airline, int flightCount) {

    public static AirlineShareDto from(AirlineShare share) {
        return new AirlineShareDto(share.airline(), share.flightCount());
    }
}
