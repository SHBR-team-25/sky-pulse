import { useCallback, useEffect, useState } from 'react';
import { Alert } from '@gravity-ui/uikit';
import { toAirportsMapQuery, useAirports } from '@features/getAirports';
import { useLiveFlights } from '@features/getLiveFlights';
import { FlightMap } from '@widgets/flight-map';
import { useAppTheme } from '@shared/contexts/theme';
import {
    isSameMapBoundsParams,
    parseMapBoundsView,
    resolveStoredMapSearch,
    toMapBoundsParams,
    writeStoredMapSearch,
    type MapBoundsParams,
} from '@shared/contexts/map-view';
import styles from './MapPage.module.css';
import { useLocation, useSearchParams } from 'react-router';
import type { Airport } from '@entities/airport';
import type { Flight } from '@entities/flight';

/** Стабильные ссылки: иначе memo на слоях карты не сработает, пока данные не пришли. */
const EMPTY_FLIGHTS: Flight[] = [];
const EMPTY_AIRPORTS: Airport[] = [];

export function MapPage() {
    const { theme } = useAppTheme();

    const [searchParams, setSearchParams] = useSearchParams();
    const { search } = useLocation();

    const [restoredSearch] = useState(() => resolveStoredMapSearch(searchParams));

    const [initialView] = useState(() =>
        parseMapBoundsView(restoredSearch ? new URLSearchParams(restoredSearch) : searchParams)
    );

    useEffect(() => {
        if (restoredSearch) {
            setSearchParams(new URLSearchParams(restoredSearch), { replace: true });
        }
    }, [restoredSearch, setSearchParams]);

    useEffect(() => {
        writeStoredMapSearch(search);
    }, [search]);

    const [flightsQuery, setFlightsQuery] = useState<MapBoundsParams>(() =>
        toMapBoundsParams(initialView)
    );

    const handleBoundsChange = useCallback((next: MapBoundsParams) => {
        setFlightsQuery((prev) => (isSameMapBoundsParams(prev, next) ? prev : next));
    }, []);

    useEffect(() => {
        setSearchParams(
            (prev) => {
                const params = new URLSearchParams(prev);
                Object.entries(flightsQuery).forEach(([key, value]) => {
                    params.set(key, String(value));
                });

                return params;
            },
            { replace: true }
        );
    }, [flightsQuery, setSearchParams]);

    // flightsQuery уже дебаунснут в FlightMap, второй дебаунс только удвоил бы задержку
    const { data, isError } = useLiveFlights(flightsQuery);
    const { data: airportsData, isError: isAirportsError } = useAirports(
        toAirportsMapQuery(flightsQuery)
    );

    return (
        <main className={styles.map} aria-label="Карта полётов и аэропортов">
            <FlightMap
                initialBounds={initialView.bounds}
                theme={theme}
                airports={airportsData?.items ?? EMPTY_AIRPORTS}
                flights={data ?? EMPTY_FLIGHTS}
                onBoundsChange={handleBoundsChange}
            />

            {(isError || isAirportsError) && (
                <div className={styles.error} role="status">
                    {isError && (
                        <Alert
                            theme="danger"
                            view="filled"
                            title="Не удалось загрузить борта"
                            message="Показаны последние полученные данные. Обновление продолжится автоматически."
                        />
                    )}
                    {isAirportsError && (
                        <Alert
                            theme="danger"
                            view="filled"
                            title="Не удалось загрузить аэропорты"
                            message="Карта работает без них."
                        />
                    )}
                </div>
            )}
        </main>
    );
}
