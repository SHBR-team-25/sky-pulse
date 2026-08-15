import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from '@gravity-ui/uikit';
import { airportsMock } from '@/entities/airport';
// eslint-disable-next-line
import { useLiveFlights, type LiveFlightsQuery } from '@/features/getLiveFlights';
import { FlightMap, isSameQuery } from '@/widgets/flight-map';
import {
    isSameMapView,
    MAP_VIEW_SYNC_DELAY_MS,
    parseMapView,
    toMapViewQuery,
    useMapView,
} from '@/shared/contexts/map-view';
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue';
import styles from './MapPage.module.css';
import { flightsMock } from '@/entities/flight';
import { useSearchParams } from 'react-router';

interface MapPageProps {
    theme?: 'light' | 'dark';
}

export function MapPage({ theme = 'light' }: MapPageProps) {
    const [searchParams, setSearchParams] = useSearchParams();
    const view = useMemo(() => parseMapView(searchParams), [searchParams]);
    const hasMapReportedRef = useRef(false);

    // eslint-disable-next-line
    const [flightsQuery, setFlightsQuery] = useState<LiveFlightsQuery>({});
    const handleBoundsChange = useCallback((next: LiveFlightsQuery) => {
        hasMapReportedRef.current = true;
        setFlightsQuery((prev) => (isSameQuery(prev, next) ? prev : next));
    }, []);

    const liveView = useMapView();
    const debouncedView = useDebouncedValue(liveView, MAP_VIEW_SYNC_DELAY_MS);

    useEffect(() => {
        if (!hasMapReportedRef.current || isSameMapView(debouncedView, view)) return;
        const nextQuery = toMapViewQuery(debouncedView);
        setSearchParams(
            (prev) => {
                const params = new URLSearchParams(prev);
                Object.entries(nextQuery).forEach(([key, value]) => params.set(key, value));
                return params;
            },
            { replace: true }
        );
    }, [debouncedView, setSearchParams]);

    // const { data, isError } = useLiveFlights(flightsQuery);
    const data = flightsMock;
    const isError = false;

    return (
        <main className={styles.map} aria-label="Карта полётов и аэропортов">
            <FlightMap
                view={view}
                theme={theme}
                airports={airportsMock.items}
                flights={data?.flights ?? []}
                onBoundsChange={handleBoundsChange}
            />

            {isError && (
                <div className={styles.error} role="status">
                    <Alert
                        theme="danger"
                        view="filled"
                        title="Не удалось загрузить борта"
                        message="Показаны последние полученные данные. Обновление продолжится автоматически."
                    />
                </div>
            )}
        </main>
    );
}
