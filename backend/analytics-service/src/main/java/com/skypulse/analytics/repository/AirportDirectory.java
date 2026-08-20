package com.skypulse.analytics.repository;

import com.skypulse.analytics.model.AirportRef;
import java.util.Optional;

/** Справочник аэропортов: в dashboard_* и airport_events лежат одни ICAO. */
public interface AirportDirectory {

    Optional<AirportRef> find(String icao);

    /** false, если справочник ещё не прочитан или YT его не отдал. */
    boolean isLoaded();

    /** Неизвестный аэропорт остаётся в выдаче с одним кодом: имя — украшение. */
    default AirportRef byIcao(String icao) {
        return find(icao).orElseGet(() -> new AirportRef(icao, null, null));
    }
}
