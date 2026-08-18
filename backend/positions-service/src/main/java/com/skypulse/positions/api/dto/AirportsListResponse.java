package com.skypulse.positions.api.dto;

import com.skypulse.positions.model.AirportPage;
import java.util.List;

public record AirportsListResponse(
        long asOf,
        List<AirportDto> items,
        int page,
        int pageSize,
        int total
) {

    public static AirportsListResponse from(AirportPage page) {
        List<AirportDto> items = page.items().stream().map(AirportDto::from).toList();
        return new AirportsListResponse(page.asOf(), items, page.page(), page.pageSize(), page.total());
    }
}
