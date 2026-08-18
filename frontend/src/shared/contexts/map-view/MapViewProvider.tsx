import { useCallback, useState, type ReactNode } from 'react';
import { MapViewContext, SetMapViewContext } from './context';
import { INITIAL_MAP_VIEW, type MapView } from './types';

interface MapViewProviderProps {
    children: ReactNode;
}

// Хранит живые center + zoom для подписей в интерфейсе
export function MapViewProvider({ children }: MapViewProviderProps) {
    const [mapView, setMapView] = useState<MapView>(INITIAL_MAP_VIEW);

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
