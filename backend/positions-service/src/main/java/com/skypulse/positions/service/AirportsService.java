package com.skypulse.positions.service;

import com.skypulse.positions.model.Airport;
import com.skypulse.positions.model.AirportDirectory;
import com.skypulse.positions.model.AirportPage;
import com.skypulse.positions.model.AirportsFilter;
import com.skypulse.positions.repository.AirportRepository;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Stream;
import org.springframework.stereotype.Service;

@Service
public class AirportsService {

    // OurAirports — это не только аэропорты: из 86 тысяч строк 23 тысячи
    // вертодромов, 13 тысяч закрытых площадок, гидроаэродромы и воздухоплавательные
    // площадки. FR12 — про аэропорты, поэтому наружу отдаём только эти три типа.
    private static final Set<String> SERVED_TYPES =
            Set.of("large_airport", "medium_airport", "small_airport");

    static final String SORT_BY_NAME = "name";
    static final int DEFAULT_PAGE_SIZE = 50;
    static final int MAX_PAGE_SIZE = 500;
    static final int MAX_LIMIT = 10_000;

    // Самое длинное искомое значение среди отдаваемых аэропортов 
    private static final int MAX_SEARCH_LENGTH = 120;

    private static final Comparator<Airport> BY_NAME =
            Comparator.comparing(Airport::name, String.CASE_INSENSITIVE_ORDER)
                    .thenComparing(Airport::icao);

    private final AirportRepository repository;

    public AirportsService(AirportRepository repository) {
        this.repository = repository;
    }

    public AirportPage list(AirportsFilter query) {
        AirportDirectory directory = repository.directory();
        String search = normalize(query.search());
        String country = normalize(query.country());

        Stream<Airport> found = directory.airports().stream()
                .filter(airport -> SERVED_TYPES.contains(airport.type()))
                .filter(airport -> matchesSearch(airport, search))
                .filter(airport -> country == null || country.equals(normalize(airport.country())))
                .filter(airport -> query.area() == null || query.area().contains(airport.lat(), airport.lon()));
        if (SORT_BY_NAME.equalsIgnoreCase(query.sortBy())) {
            found = found.sorted(BY_NAME);
        }
        List<Airport> matched = found.toList();

        int pageSize = effectivePageSize(query);
        int page = query.limit() != null ? 1 : Math.max(1, query.page() == null ? 1 : query.page());
        // long, потому что page приходит от клиента и (page - 1) * pageSize переполняет int.
        long from = Math.min((long) (page - 1) * pageSize, matched.size());
        long to = Math.min(from + pageSize, matched.size());

        List<Airport> items = matched.subList((int) from, (int) to);
        return new AirportPage(items, page, pageSize, matched.size(), directory.asOf());
    }

    private static int effectivePageSize(AirportsFilter query) {
        if (query.limit() != null) {
            return clamp(query.limit(), MAX_LIMIT);
        }
        return query.pageSize() == null ? DEFAULT_PAGE_SIZE : clamp(query.pageSize(), MAX_PAGE_SIZE);
    }

    private static int clamp(int value, int max) {
        return Math.min(Math.max(value, 1), max);
    }

    // search сравнивается в памяти и в запрос к YT не попадает, поэтому кавычка
    // и процент — обычные символы, а не подстановочные и не средство инъекции.
    private static boolean matchesSearch(Airport airport, String search) {
        if (search == null) {
            return true;
        }
        return contains(airport.name(), search)
                || contains(airport.city(), search)
                || contains(airport.icao(), search)
                || contains(airport.iata(), search);
    }

    private static boolean contains(String value, String search) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(search);
    }

    private static String normalize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String trimmed = value.trim().toLowerCase(Locale.ROOT);
        return trimmed.length() <= MAX_SEARCH_LENGTH ? trimmed : trimmed.substring(0, MAX_SEARCH_LENGTH);
    }
}
