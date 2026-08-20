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
    MAP_VIEW_SYNC_DELAY_MS,
    MAP_ZOOM_RANGE,
    toMapBoundsParams,
    useSetMapView,
    type MapBoundsParams,
} from '@/shared/contexts/map-view';
import { useDebouncedCallback } from '@/shared/lib/useDebouncedCallback';
import { AirportsClusterLayer } from './AirportsClusterLayer';
import styles from './FlightMap.module.css';
import type { Airport } from '@/entities/airport';
import type { Flight } from '@/entities/flight';
import { FlightsClusterLayer } from './FlightsClusterLayer';

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

    const notifyBoundsChange = useDebouncedCallback(
        (params: MapBoundsParams) => onBoundsChange?.(params),
        MAP_VIEW_SYNC_DELAY_MS
    );

    const handleMapUpdate = useCallback<MapEventUpdateHandler>(
        ({ location }) => {
            setMapView({ center: location.center, zoom: location.zoom });
            // Считаем сразу: location принадлежит карте и может переиспользоваться между кадрами
            notifyBoundsChange(toMapBoundsParams(location));
        },
        [setMapView, notifyBoundsChange]
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
                <AirportsClusterLayer airports={airports} />
                <FlightsClusterLayer flights={flights} />

                <YMapControls position="right">
                    <YMapZoomControl />
                </YMapControls>
            </YMap>
        </div>
    );
}
