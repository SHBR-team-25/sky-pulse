package com.skypulse.analytics.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.skypulse.analytics.model.AirportRef;
import org.junit.jupiter.api.Test;

class YtAirportDirectoryTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void mapsAirportWithFullCodes() throws Exception {
        AirportRef airport = YtAirportDirectory.toAirportRef(objectMapper.readTree("""
                {"ident": "EDDK", "icao_code": "EDDK", "iata_code": "CGN", "name": "Cologne Bonn Airport"}
                """));

        assertThat(airport).isEqualTo(new AirportRef("EDDK", "CGN", "Cologne Bonn Airport"));
    }

    // В OurAirports icao_code пуст у большинства записей — тогда кодом становится ident.
    @Test
    void fallsBackToIdentWhenIcaoCodeIsMissing() throws Exception {
        AirportRef airport = YtAirportDirectory.toAirportRef(objectMapper.readTree("""
                {"ident": "00AA", "icao_code": null, "iata_code": null, "name": "Aero B Ranch Airport"}
                """));

        assertThat(airport.icao()).isEqualTo("00AA");
        assertThat(airport.iata()).isNull();
        assertThat(airport.name()).isEqualTo("Aero B Ranch Airport");
    }

    // Строка вообще без кода в справочнике бесполезна: по ней аэропорт не найти.
    @Test
    void skipsRowWithoutAnyCode() throws Exception {
        assertThat(YtAirportDirectory.toAirportRef(objectMapper.readTree("""
                {"ident": null, "icao_code": null, "iata_code": "ZZZ", "name": "Nowhere"}
                """))).isNull();
    }
}
