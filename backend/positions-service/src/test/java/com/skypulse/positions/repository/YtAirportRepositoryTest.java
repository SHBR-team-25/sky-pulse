package com.skypulse.positions.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skypulse.positions.model.Airport;
import org.junit.jupiter.api.Test;

class YtAirportRepositoryTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void mapsFullRowToAirport() throws Exception {
        JsonNode row = objectMapper.readTree("""
                {
                  "ident": "UUEE", "icao_code": "UUEE", "iata_code": "SVO",
                  "name": "Sheremetyevo International Airport", "type": "large_airport",
                  "municipality": "Moscow", "iso_country": "RU",
                  "latitude_deg": 55.976858, "longitude_deg": 37.41121
                }
                """);

        Airport airport = YtAirportRepository.toAirport(row);

        assertThat(airport.icao()).isEqualTo("UUEE");
        assertThat(airport.iata()).isEqualTo("SVO");
        assertThat(airport.name()).isEqualTo("Sheremetyevo International Airport");
        assertThat(airport.type()).isEqualTo("large_airport");
        assertThat(airport.city()).isEqualTo("Moscow");
        assertThat(airport.country()).isEqualTo("RU");
        assertThat(airport.lat()).isEqualTo(55.976858);
        assertThat(airport.lon()).isEqualTo(37.41121);
    }

    // В OurAirports icao_code пуст у 88% записей — тогда кодом становится ident.
    @Test
    void fallsBackToIdentWhenIcaoCodeIsMissing() throws Exception {
        JsonNode row = objectMapper.readTree("""
                {
                  "ident": "00AA", "icao_code": null, "iata_code": null,
                  "name": "Aero B Ranch Airport", "type": "small_airport",
                  "municipality": null, "iso_country": "US",
                  "latitude_deg": 38.704022, "longitude_deg": -101.473911
                }
                """);

        Airport airport = YtAirportRepository.toAirport(row);

        assertThat(airport.icao()).isEqualTo("00AA");
        assertThat(airport.iata()).isNull();
        assertThat(airport.city()).isNull();
        assertThat(airport.country()).isEqualTo("US");
    }

    // Пустая строка в CSV доезжает до YT и как "", и как null — оба случая означают «кода нет».
    @Test
    void treatsBlankCodesAsMissing() throws Exception {
        JsonNode row = objectMapper.readTree("""
                {
                  "ident": "00A", "icao_code": "", "iata_code": "  ",
                  "name": "Total RF Heliport", "type": "heliport",
                  "municipality": "", "iso_country": "US",
                  "latitude_deg": 40.070985, "longitude_deg": -74.933689
                }
                """);

        Airport airport = YtAirportRepository.toAirport(row);

        assertThat(airport.icao()).isEqualTo("00A");
        assertThat(airport.iata()).isNull();
        assertThat(airport.city()).isNull();
    }

    // Аэропорт без координат отрисовать негде, а без названия — нечего показать
    // в списке и не с чем сравнивать при сортировке.
    @Test
    void rejectsRowWithoutCoordinatesOrName() throws Exception {
        JsonNode noCoordinates = objectMapper.readTree("""
                {"ident": "00AA", "name": "Aero B Ranch Airport", "type": "small_airport"}
                """);
        JsonNode noName = objectMapper.readTree("""
                {"ident": "00AA", "type": "small_airport",
                 "latitude_deg": 38.704022, "longitude_deg": -101.473911}
                """);

        assertThatThrownBy(() -> YtAirportRepository.toAirport(noCoordinates))
                .isInstanceOf(MalformedRowException.class)
                .hasMessageContaining("latitude_deg");
        assertThatThrownBy(() -> YtAirportRepository.toAirport(noName))
                .isInstanceOf(MalformedRowException.class)
                .hasMessageContaining("name");
    }
}
