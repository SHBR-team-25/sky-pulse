import { useCallback } from 'react';
import type {
    LngLatBounds,
    MapEventUpdateHandler,
    YMapLocationRequest,
} from '@yandex/ymaps3-types';
import {
    YMap,
    YMapControls,
    YMapDefaultFeaturesLayer,
    YMapDefaultSchemeLayer,
    YMapListener,
    YMapZoomControl,
    reactify,
} from '@/shared/lib/ymaps3';
import {
    MAP_ZOOM_RANGE,
    toMapBoundsParams,
    useSetMapView,
    type MapBoundsParams,
} from '@/shared/contexts/map-view';
import { AirportsLayer } from './AirportsLayer';
import { FlightsLayer } from './FlightsLayer';
import styles from './FlightMap.module.css';
import type { Airport } from '@/entities/airport';
import type { Flight } from '@/entities/flight';

interface FlightMapProps {
    // Читается только при инициализации
    initialBounds: LngLatBounds;
    airports: Airport[];
    flights: Flight[];
    theme?: 'light' | 'dark';
    onBoundsChange?: (params: MapBoundsParams) => void;
}

export function FlightMap({
    initialBounds,
    airports,
    flights,
    theme = 'light',
    onBoundsChange,
}: FlightMapProps) {
    const setMapView = useSetMapView();

    const handleMapUpdate = useCallback<MapEventUpdateHandler>(
        ({ location }) => {
            setMapView({ center: location.center, zoom: location.zoom });
            onBoundsChange?.(toMapBoundsParams(location));
        },
        [setMapView, onBoundsChange]
    );

    const location = reactify.useDefault<YMapLocationRequest>(
        { bounds: initialBounds, duration: 0 },
        []
    );

    return (
        <div className={styles.map}>
            <YMap
                theme={theme}
                location={location}
                zoomRange={MAP_ZOOM_RANGE}
                zoomRounding="smooth"
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
