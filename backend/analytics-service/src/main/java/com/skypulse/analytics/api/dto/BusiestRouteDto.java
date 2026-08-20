package com.skypulse.analytics.api.dto;

import com.skypulse.analytics.model.RouteTraffic;

public record BusiestRouteDto(
        AirportRefDto origin,
        AirportRefDto destination,
        int flightCount
) {

    public static BusiestRouteDto from(RouteTraffic route) {
        return new BusiestRouteDto(
                AirportRefDto.from(route.origin()),
                AirportRefDto.from(route.destination()),
                route.flightCount());
    }
}
