package com.skypulse.positions.api.dto;


public record AirportsQuery(
        String search,
        String country,
        String sortBy,
        BoundingBox area,
        Integer page,
        Integer pageSize,
        Integer limit
) {
}
