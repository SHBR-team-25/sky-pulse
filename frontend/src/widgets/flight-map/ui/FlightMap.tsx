import { useCallback } from 'react';
import type { MapEventUpdateHandler, YMapLocationRequest } from '@yandex/ymaps3-types';
import {
    YMap,
    YMapControls,
    YMapDefaultFeaturesLayer,
    YMapDefaultSchemeLayer,
    YMapListener,
    YMapZoomControl,
    reactify,
} from '@/shared/lib/ymaps3';
import { INITIAL_MAP_VIEW, useSetMapView } from '@/shared/contexts/map-view';
import { AirportsLayer } from './AirportsLayer';
import { FlightsLayer } from './FlightsLayer';
import styles from './FlightMap.module.css';
import type { Airport } from '@/entities/airport';
import type { LiveFlight } from '@/entities/flight';

const FLIGHTS_LOCATION: YMapLocationRequest = {
    center: INITIAL_MAP_VIEW.center,
    zoom: INITIAL_MAP_VIEW.zoom,
};

const ZOOM_RANGE = { min: 3, max: 15 };

interface FlightMapProps {
    airports: Airport[];
    flights: LiveFlight[];
    theme?: 'light' | 'dark';
}

export function FlightMap({ airports, flights, theme = 'light' }: FlightMapProps) {
    const setMapView = useSetMapView();
    const handleMapUpdate = useCallback<MapEventUpdateHandler>(
        ({ location }) => {
            // обновляем в контексте для отображения в футере
            setMapView({ center: location.center, zoom: location.zoom });
        },
        [setMapView]
    );

    return (
        <div className={styles.map}>
            <YMap
                theme={theme}
                location={reactify.useDefault(FLIGHTS_LOCATION)}
                zoomRange={ZOOM_RANGE}
            >
                <YMapDefaultSchemeLayer />
                <YMapDefaultFeaturesLayer />
                <YMapListener onUpdate={handleMapUpdate} />
                <AirportsLayer airports={airports} />
                <FlightsLayer flights={flights} />

                <YMapControls position="right">
                    <YMapZoomControl />
                </YMapControls>
            </YMap>
        </div>
    );
}
