package com.skypulse.positions.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.skypulse.positions.model.Airport;
import com.skypulse.positions.model.AirportDirectory;
import com.skypulse.positions.model.AirportPage;
import com.skypulse.positions.model.AirportsFilter;
import com.skypulse.positions.model.BoundingBox;
import java.util.List;
import org.junit.jupiter.api.Test;

class AirportsServiceTest {

    private static final Airport SVO = new Airport(
            "UUEE", "SVO", "Sheremetyevo International Airport", "large_airport",
            "Moscow", "RU", 55.976858, 37.41121);
    private static final Airport DME = new Airport(
            "UUDD", "DME", "Domodedovo International Airport", "large_airport",
            "Moscow", "RU", 55.40883, 37.90630);
    private static final Airport CDG = new Airport(
            "LFPG", "CDG", "Charles de Gaulle International Airport", "large_airport",
            "Paris (Roissy-en-France, Val-d'Oise)", "FR", 49.00896, 2.554117);
    private static final Airport HELIPORT = new Airport(
            "RU-0796", null, "Sheremetyevo Heliport", "heliport",
            "Sheremetyevo", "RU", 47.34019, 134.27342);
    private static final Airport NO_CITY = new Airport(
            "00AA", null, "Aero B Ranch Airport", "small_airport",
            null, "US", 38.704022, -101.473911);

    private final AirportsService service = new AirportsService(
            () -> new AirportDirectory(List.of(SVO, DME, CDG, HELIPORT, NO_CITY), 1786000000L));

    private static AirportsFilter query() {
        return new AirportsFilter(null, null, null, null, null, null, null);
    }

    private static List<String> codes(AirportPage response) {
        return response.items().stream().map(Airport::icao).toList();
    }

    @Test
    void returnsAirportsWithoutFiltersAndKeepsTableOrder() {
        AirportPage response = service.list(query());

        assertThat(codes(response)).containsExactly("UUEE", "UUDD", "LFPG", "00AA");
        assertThat(response.asOf()).isEqualTo(1786000000L);
        assertThat(response.page()).isEqualTo(1);
        assertThat(response.pageSize()).isEqualTo(AirportsService.DEFAULT_PAGE_SIZE);
        assertThat(response.total()).isEqualTo(4);
    }

    // Вертодромы и закрытые площадки — большая часть OurAirports, но не аэропорты.
    @Test
    void hidesNonAirportTypes() {
        assertThat(codes(service.list(query()))).doesNotContain("RU-0796");
    }

    @Test
    void searchesByNameCaseInsensitivelyAsSubstring() {
        var response = service.list(new AirportsFilter("sheremet", null, null, null, null, null, null));

        assertThat(codes(response)).containsExactly("UUEE");
    }

    @Test
    void searchesByCityIcaoAndIata() {
        assertThat(codes(service.list(new AirportsFilter("moscow", null, null, null, null, null, null))))
                .containsExactly("UUEE", "UUDD");
        assertThat(codes(service.list(new AirportsFilter("lfpg", null, null, null, null, null, null))))
                .containsExactly("LFPG");
        assertThat(codes(service.list(new AirportsFilter("CDG", null, null, null, null, null, null))))
                .containsExactly("LFPG");
    }

    // Кавычка и процент — обычные символы: они просто ничему не соответствуют.
    @Test
    void treatsSpecialCharactersInSearchLiterally() {
        var response = service.list(new AirportsFilter("' or %", null, null, null, null, null, null));

        assertThat(response.items()).isEmpty();
        assertThat(response.total()).isZero();
    }

    @Test
    void filtersByCountryIgnoringCase() {
        assertThat(codes(service.list(new AirportsFilter(null, "ru", null, null, null, null, null))))
                .containsExactly("UUEE", "UUDD");
        assertThat(service.list(new AirportsFilter(null, "___", null, null, null, null, null)).total())
                .isZero();
    }

    @Test
    void sortsByNameWhenAsked() {
        var response = service.list(new AirportsFilter(null, null, "name", null, null, null, null));

        assertThat(codes(response)).containsExactly("00AA", "LFPG", "UUDD", "UUEE");
    }

    @Test
    void ignoresUnknownSortBy() {
        var response = service.list(new AirportsFilter(null, null, "trafficIndex", null, null, null, null));

        assertThat(codes(response)).containsExactly("UUEE", "UUDD", "LFPG", "00AA");
    }

    @Test
    void paginatesWithoutOverlapAndKeepsTotalStable() {
        var first = service.list(new AirportsFilter(null, null, "name", null, 1, 2, null));
        var second = service.list(new AirportsFilter(null, null, "name", null, 2, 2, null));

        assertThat(codes(first)).containsExactly("00AA", "LFPG");
        assertThat(codes(second)).containsExactly("UUDD", "UUEE");
        assertThat(first.total()).isEqualTo(second.total()).isEqualTo(4);
    }

    @Test
    void returnsEmptyPageBeyondLastOne() {
        var response = service.list(new AirportsFilter(null, null, null, null, 99, 2, null));

        assertThat(response.items()).isEmpty();
        assertThat(response.total()).isEqualTo(4);
        assertThat(response.page()).isEqualTo(99);
    }

    // page от клиента может быть каким угодно: (page - 1) * pageSize не должно переполняться.
    @Test
    void survivesExtremePagingValues() {
        var response = service.list(new AirportsFilter(null, null, null, null, Integer.MAX_VALUE, 1000, null));

        assertThat(response.items()).isEmpty();
        assertThat(response.pageSize()).isEqualTo(AirportsService.MAX_PAGE_SIZE);
    }

    @Test
    void clampsNonPositivePagingValues() {
        var response = service.list(new AirportsFilter(null, null, null, null, 0, 0, null));

        assertThat(response.page()).isEqualTo(1);
        assertThat(response.pageSize()).isEqualTo(1);
        assertThat(codes(response)).containsExactly("UUEE");
    }

    @Test
    void limitReplacesTablePagination() {
        var response = service.list(new AirportsFilter(null, null, null, null, 3, 2, 2));

        assertThat(codes(response)).containsExactly("UUEE", "UUDD");
        assertThat(response.page()).isEqualTo(1);
        assertThat(response.pageSize()).isEqualTo(2);
        assertThat(response.total()).isEqualTo(4);
    }

    @Test
    void clampsLimitToCeiling() {
        var response = service.list(new AirportsFilter(null, null, null, null, null, null, 1_000_000));

        assertThat(response.pageSize()).isEqualTo(AirportsService.MAX_LIMIT);
        assertThat(response.items()).hasSize(4);
    }

    @Test
    void filtersByBoundingBox() {
        var moscow = new BoundingBox(36.0, 55.0, 38.5, 56.5);
        var response = service.list(new AirportsFilter(null, null, null, moscow, null, null, null));

        assertThat(codes(response)).containsExactly("UUEE", "UUDD");
    }

    // Вырожденная рамка (lonMin > lonMax) — это пусто, а не ошибка.
    @Test
    void returnsEmptyForInvertedBoundingBox() {
        var inverted = new BoundingBox(38.5, 55.0, 36.0, 56.5);
        var response = service.list(new AirportsFilter(null, null, null, inverted, null, null, null));

        assertThat(response.items()).isEmpty();
        assertThat(response.total()).isZero();
    }

    @Test
    void keepsAirportWithoutCityInResults() {
        var response = service.list(new AirportsFilter(null, "US", null, null, null, null, null));

        assertThat(response.items()).singleElement()
                .satisfies(item -> {
                    assertThat(item.icao()).isEqualTo("00AA");
                    assertThat(item.city()).isNull();
                    assertThat(item.iata()).isNull();
                    assertThat(item.lat()).isEqualTo(38.704022);
                });
    }
}
