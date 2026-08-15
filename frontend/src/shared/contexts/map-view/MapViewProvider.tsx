import { useCallback, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router';
import { MapViewContext, SetMapViewContext } from './context';
import { parseMapView } from './lib/mapViewParams';
import { type MapView } from './types';

interface MapViewProviderProps {
    children: ReactNode;
}

export function MapViewProvider({ children }: MapViewProviderProps) {
    const [searchParams] = useSearchParams();
    const [mapView, setMapView] = useState(() => parseMapView(searchParams));

    const updateMapView = useCallback((nextMapView: MapView) => {
        setMapView((currentMapView) => {
            const hasNotChanged =
                currentMapView.zoom === nextMapView.zoom &&
                currentMapView.center[0] === nextMapView.center[0] &&
                currentMapView.center[1] === nextMapView.center[1];

            return hasNotChanged ? currentMapView : nextMapView;
        });
    }, []);

    return (
        <SetMapViewContext value={updateMapView}>
            <MapViewContext value={mapView}>{children}</MapViewContext>
        </SetMapViewContext>
    );
}
