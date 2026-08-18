package com.skypulse.positions.api.dto;

import java.util.List;

public record AirportsListResponse(
        long asOf,
        List<AirportDto> items,
        int page,
        int pageSize,
        int total
) {
}
