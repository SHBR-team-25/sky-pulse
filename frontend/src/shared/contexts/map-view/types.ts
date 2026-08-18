import type { LngLat, LngLatBounds } from '@yandex/ymaps3-types';

export interface MapView {
    center: LngLat;
    zoom: number;
}

// bounds карты: [[lonMin, latMax], [lonMax, latMin]]
export interface MapBoundsView {
    bounds: LngLatBounds;
    zoom: number;
}

export interface MapRectParams {
    lonMin: number;
    latMin: number;
    lonMax: number;
    latMax: number;
}

export interface MapBoundsParams extends MapRectParams {
    zoom: number;
}

export const INITIAL_MAP_VIEW: MapView = {
    center: [34, 57.8],
    zoom: 5,
};

export const INITIAL_MAP_BOUNDS_VIEW: MapBoundsView = {
    bounds: [
        [14, 66],
        [54, 48],
    ],
    zoom: 5,
};

export const MAP_ZOOM_RANGE = { min: 3, max: 15 };
