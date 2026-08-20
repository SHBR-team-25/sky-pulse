package com.skypulse.analytics.api.dto;

import com.skypulse.analytics.model.ManufacturerShare;

public record ManufacturerShareDto(String manufacturer, int flightCount) {

    public static ManufacturerShareDto from(ManufacturerShare share) {
        return new ManufacturerShareDto(share.manufacturer(), share.flightCount());
    }
}
