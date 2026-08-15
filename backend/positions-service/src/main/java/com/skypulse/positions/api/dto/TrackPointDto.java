package com.skypulse.positions.api.dto;

public record TrackPointDto(long timePosition, double lat, double lon, Double baroAltitude) {
}
