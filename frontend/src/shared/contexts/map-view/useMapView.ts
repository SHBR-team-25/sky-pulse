import { useContext } from 'react';
import { MapViewContext, SetMapViewContext } from './context';

export function useMapView() {
    const mapView = useContext(MapViewContext);

    if (!mapView) {
        throw new Error('useMapView must be used within MapViewProvider');
    }

    return mapView;
}

export function useSetMapView() {
    const setMapView = useContext(SetMapViewContext);

    if (!setMapView) {
        throw new Error('useSetMapView must be used within MapViewProvider');
    }

    return setMapView;
}
