package com.skypulse.analytics.api.dto;

import com.skypulse.analytics.model.CountryShare;

public record CountryShareDto(String country, int flightCount) {

    public static CountryShareDto from(CountryShare share) {
        return new CountryShareDto(share.country(), share.flightCount());
    }
}
