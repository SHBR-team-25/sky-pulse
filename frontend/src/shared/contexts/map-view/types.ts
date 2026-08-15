import type { LngLat } from '@yandex/ymaps3-types';

export interface MapView {
    center: LngLat;
    zoom: number;
}

export const INITIAL_MAP_VIEW: MapView = {
    center: [34, 57.8],
    zoom: 5,
};

export const MAP_ZOOM_RANGE = { min: 3, max: 15 };
