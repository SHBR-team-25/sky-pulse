package com.skypulse.positions.model;

public record AirportsFilter(
        String search,
        String country,
        String sortBy,
        BoundingBox area,
        Integer page,
        Integer pageSize,
        Integer limit
) {
}
