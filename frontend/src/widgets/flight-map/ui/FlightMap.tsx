import { useCallback, useEffect, useRef, useState } from 'react';
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
import {
    isSameMapView,
    MAP_ZOOM_RANGE,
    useSetMapView,
    type MapView,
} from '@/shared/contexts/map-view';
import { AirportsLayer } from './AirportsLayer';
import { FlightsLayer } from './FlightsLayer';
import styles from './FlightMap.module.css';
import { toBboxParams } from '../lib/toBboxParams';
import type { Airport } from '@/entities/airport';
import type { LiveFlight } from '@/entities/flight';
import type { LiveFlightsQuery } from '@/features/getLiveFlights';

interface FlightMapProps {
    view: MapView;
    airports: Airport[];
    flights: LiveFlight[];
    theme?: 'light' | 'dark';
    onBoundsChange?: (params: LiveFlightsQuery) => void;
}

export function FlightMap({
    view,
    airports,
    flights,
    theme = 'light',
    onBoundsChange,
}: FlightMapProps) {
    const setMapView = useSetMapView();
    const [appliedView, setAppliedView] = useState(view);
    const syncedViewRef = useRef(view);

    const handleMapUpdate = useCallback<MapEventUpdateHandler>(
        ({ location }) => {
            syncedViewRef.current = { center: location.center, zoom: location.zoom };
            setMapView(syncedViewRef.current);
            onBoundsChange?.(toBboxParams(location));
        },
        [setMapView, onBoundsChange]
    );

    useEffect(() => {
        if (isSameMapView(view, syncedViewRef.current)) return;

        syncedViewRef.current = view;
        setAppliedView(view);
    }, [view]);

    const location = reactify.useDefault<YMapLocationRequest>(
        { center: appliedView.center, zoom: appliedView.zoom, duration: 0 },
        [appliedView]
    );

    return (
        <div className={styles.map}>
            <YMap theme={theme} location={location} zoomRange={MAP_ZOOM_RANGE}>
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
