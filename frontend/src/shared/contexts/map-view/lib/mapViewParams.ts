import { INITIAL_MAP_VIEW, MAP_ZOOM_RANGE, type MapView } from '../types';

export const MAP_VIEW_LNG_PARAM = 'lng';
export const MAP_VIEW_LAT_PARAM = 'lat';
export const MAP_VIEW_ZOOM_PARAM = 'zoom';

export const MAP_VIEW_SYNC_DELAY_MS = 300;

const COORDINATE_DIGITS = 4;
const ZOOM_DIGITS = 2;

const LAT_LIMIT = 90;
const LON_LIMIT = 180;

function isWithin(value: number, limit: number): boolean {
    return Number.isFinite(value) && Math.abs(value) <= limit;
}

function round(value: number, digits: number): number {
    return Number(value.toFixed(digits));
}

export function parseMapView(searchParams: URLSearchParams): MapView {
    const lng = Number(searchParams.get(MAP_VIEW_LNG_PARAM));
    const lat = Number(searchParams.get(MAP_VIEW_LAT_PARAM));
    const zoom = Number(searchParams.get(MAP_VIEW_ZOOM_PARAM));

    const isValid =
        isWithin(lng, LON_LIMIT) &&
        isWithin(lat, LAT_LIMIT) &&
        Number.isFinite(zoom) &&
        zoom >= MAP_ZOOM_RANGE.min &&
        zoom <= MAP_ZOOM_RANGE.max;

    if (!isValid) {
        return INITIAL_MAP_VIEW;
    }

    return { center: [lng, lat], zoom };
}

export function toMapViewQuery(view: MapView): Record<string, string> {
    const [lng, lat] = view.center;

    return {
        [MAP_VIEW_LNG_PARAM]: String(round(lng, COORDINATE_DIGITS)),
        [MAP_VIEW_LAT_PARAM]: String(round(lat, COORDINATE_DIGITS)),
        [MAP_VIEW_ZOOM_PARAM]: String(round(view.zoom, ZOOM_DIGITS)),
    };
}

export function isSameMapView(was: MapView, current: MapView): boolean {
    const wasQuery = toMapViewQuery(was);
    const currentQuery = toMapViewQuery(current);

    return (
        wasQuery[MAP_VIEW_LNG_PARAM] === currentQuery[MAP_VIEW_LNG_PARAM] &&
        wasQuery[MAP_VIEW_LAT_PARAM] === currentQuery[MAP_VIEW_LAT_PARAM] &&
        wasQuery[MAP_VIEW_ZOOM_PARAM] === currentQuery[MAP_VIEW_ZOOM_PARAM]
    );
}
