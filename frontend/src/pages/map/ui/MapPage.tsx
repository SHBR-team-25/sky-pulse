import { useCallback, useEffect, useState } from 'react';
import { Alert } from '@gravity-ui/uikit';
import { toAirportsMapQuery, useAirports } from '@/features/getAirports';
import { useLiveFlights } from '@/features/getLiveFlights';
import { FlightMap } from '@/widgets/flight-map';
import {
    isSameMapBoundsParams,
    MAP_VIEW_SYNC_DELAY_MS,
    parseMapBoundsView,
    resolveStoredMapSearch,
    toMapBoundsParams,
    writeStoredMapSearch,
    type MapBoundsParams,
} from '@/shared/contexts/map-view';
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue';
import styles from './MapPage.module.css';
import { useLocation, useSearchParams } from 'react-router';

interface MapPageProps {
    theme?: 'light' | 'dark';
}

export function MapPage({ theme = 'light' }: MapPageProps) {
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

    const urlQuery = useDebouncedValue(flightsQuery, MAP_VIEW_SYNC_DELAY_MS);

    useEffect(() => {
        setSearchParams(
            (prev) => {
                const params = new URLSearchParams(prev);
                Object.entries(urlQuery).forEach(([key, value]) => {
                    params.set(key, String(value));
                });

                return params;
            },
            { replace: true }
        );
    }, [urlQuery, setSearchParams]);

    const { data, isError } = useLiveFlights(flightsQuery);
    const { data: airportsData, isError: isAirportsError } = useAirports(
        toAirportsMapQuery(flightsQuery)
    );

    return (
        <main className={styles.map} aria-label="Карта полётов и аэропортов">
            <FlightMap
                initialBounds={initialView.bounds}
                theme={theme}
                airports={airportsData?.items ?? []}
                flights={data ?? []}
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
