import { useCallback, useRef } from 'react';
import type {
    LngLatBounds,
    MapEventUpdateHandler,
    YMap as YMapInstance,
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
import {
    CLUSTER_ZOOM_DURATION_MS,
    getClusterZoom,
    type ClusterClickHandler,
} from '../lib/clusterZoom';
import styles from './FlightMap.module.css';
import type { Airport } from '@/entities/airport';
import type { Flight } from '@/entities/flight';
import { FlightsClusterLayer } from './FlightsClusterLayer';
import { MapLegend } from './MapLegend/MapLegend';
import { mapCustomizationByTheme } from './mapCustomization';

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
    const mapRef = useRef<YMapInstance | undefined>(undefined);

    const notifyBoundsChange = useDebouncedCallback(
        (params: MapBoundsParams) => onBoundsChange?.(params),
        MAP_VIEW_SYNC_DELAY_MS
    );

    const handleMapUpdate = useCallback<MapEventUpdateHandler>(
        ({ location }) => {
            setMapView({ center: location.center, zoom: location.zoom });
            notifyBoundsChange(toMapBoundsParams(location));
        },
        [setMapView, notifyBoundsChange]
    );

    const handleClusterClick = useCallback<ClusterClickHandler>((coordinates) => {
        const map = mapRef.current;

        if (!map) {
            return;
        }

        map.setLocation({
            center: coordinates,
            zoom: getClusterZoom(map.zoom),
            duration: CLUSTER_ZOOM_DURATION_MS,
            easing: 'ease-in-out',
        });
    }, []);

    const location = reactify.useDefault<YMapLocationRequest>(
        { bounds: initialBounds, duration: 0 },
        []
    );

    return (
        <div className={styles.map}>
            <YMap
                ref={mapRef}
                theme={theme}
                location={location}
                zoomRange={MAP_ZOOM_RANGE}
                zoomRounding="smooth"
            >
                <YMapDefaultSchemeLayer customization={mapCustomizationByTheme[theme]} />
                <YMapDefaultFeaturesLayer />
                <YMapListener onUpdate={handleMapUpdate} />
                <AirportsClusterLayer airports={airports} onClusterClick={handleClusterClick} />
                <FlightsClusterLayer flights={flights} onClusterClick={handleClusterClick} />

                <YMapControls position="right">
                    <YMapZoomControl />
                </YMapControls>
            </YMap>

            <div className={styles.legend}>
                <MapLegend />
            </div>
        </div>
    );
}
