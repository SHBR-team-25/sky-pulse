import type { LngLatBounds } from '@yandex/ymaps3-types';
import {
    INITIAL_MAP_BOUNDS_VIEW,
    MAP_ZOOM_RANGE,
    type MapBoundsParams,
    type MapBoundsView,
    type MapRectParams,
} from '../types';

export const MAP_LON_MIN_PARAM = 'lonMin';
export const MAP_LAT_MIN_PARAM = 'latMin';
export const MAP_LON_MAX_PARAM = 'lonMax';
export const MAP_LAT_MAX_PARAM = 'latMax';
export const MAP_VIEW_ZOOM_PARAM = 'zoom';

export const MAP_VIEW_SYNC_DELAY_MS = 300;

const BOUNDS_PRECISION = 100;
const EPSILON = 2;

const LAT_LIMIT = 90;
const LON_LIMIT = 180;
const WORLD_LON_SPAN = 360;

const RECT_PARAMS = [
    MAP_LON_MIN_PARAM,
    MAP_LAT_MIN_PARAM,
    MAP_LON_MAX_PARAM,
    MAP_LAT_MAX_PARAM,
] as const;

function isWithin(value: number, limit: number): boolean {
    return Number.isFinite(value) && Math.abs(value) <= limit;
}

function round(value: number, digits: number): number {
    return Number(value.toFixed(digits));
}

function clamp(value: number, limit: number): number {
    return Math.min(Math.max(value, -limit), limit);
}

function toGrid(value: number): number {
    return round(value * BOUNDS_PRECISION, EPSILON);
}

function quantizeMin(value: number): number {
    return Math.floor(toGrid(value)) / BOUNDS_PRECISION;
}

function quantizeMax(value: number): number {
    return Math.ceil(toGrid(value)) / BOUNDS_PRECISION;
}

// Приводит долготу к диапазону [-180, 180)
function normalizeLon(lon: number): number {
    return ((((lon + LON_LIMIT) % WORLD_LON_SPAN) + WORLD_LON_SPAN) % WORLD_LON_SPAN) - LON_LIMIT;
}

// Возвращает null, если в параметрах нет корректного вида карты
export function tryParseMapBoundsView(searchParams: URLSearchParams): MapBoundsView | null {
    const lonMin = Number(searchParams.get(MAP_LON_MIN_PARAM));
    const latMin = Number(searchParams.get(MAP_LAT_MIN_PARAM));
    const lonMax = Number(searchParams.get(MAP_LON_MAX_PARAM));
    const latMax = Number(searchParams.get(MAP_LAT_MAX_PARAM));
    const zoom = Number(searchParams.get(MAP_VIEW_ZOOM_PARAM));

    const isValid =
        isWithin(lonMin, LON_LIMIT) &&
        isWithin(lonMax, LON_LIMIT) &&
        isWithin(latMin, LAT_LIMIT) &&
        isWithin(latMax, LAT_LIMIT) &&
        lonMin < lonMax &&
        latMin < latMax &&
        Number.isFinite(zoom) &&
        zoom >= MAP_ZOOM_RANGE.min &&
        zoom <= MAP_ZOOM_RANGE.max;

    if (!isValid) {
        return null;
    }

    return {
        bounds: [
            [lonMin, latMax],
            [lonMax, latMin],
        ],
        zoom,
    };
}

export function parseMapBoundsView(searchParams: URLSearchParams): MapBoundsView {
    return tryParseMapBoundsView(searchParams) ?? INITIAL_MAP_BOUNDS_VIEW;
}

function toMapRectParams(bounds: LngLatBounds): MapRectParams {
    const [[lonWest, latFirst], [lonEast, latSecond]] = bounds;

    const isWholeWorld = lonEast - lonWest >= WORLD_LON_SPAN;
    const normalizedWest = normalizeLon(lonWest);
    const normalizedEast = normalizeLon(lonEast);

    const isCrossingAntimeridian = normalizedWest > normalizedEast;

    const [lonMin, lonMax] =
        isWholeWorld || isCrossingAntimeridian
            ? [-LON_LIMIT, LON_LIMIT]
            : [
                  clamp(quantizeMin(normalizedWest), LON_LIMIT),
                  clamp(quantizeMax(normalizedEast), LON_LIMIT),
              ];

    return {
        [MAP_LON_MIN_PARAM]: lonMin,
        [MAP_LAT_MIN_PARAM]: clamp(quantizeMin(Math.min(latFirst, latSecond)), LAT_LIMIT),
        [MAP_LON_MAX_PARAM]: lonMax,
        [MAP_LAT_MAX_PARAM]: clamp(quantizeMax(Math.max(latFirst, latSecond)), LAT_LIMIT),
    };
}

export function toMapBoundsParams(view: MapBoundsView): MapBoundsParams {
    return {
        ...toMapRectParams(view.bounds),
        [MAP_VIEW_ZOOM_PARAM]: round(view.zoom, EPSILON),
    };
}

function isSameMapRect(was: MapRectParams, current: MapRectParams): boolean {
    return RECT_PARAMS.every((param) => was[param] === current[param]);
}

export function isSameMapBoundsParams(was: MapBoundsParams, current: MapBoundsParams): boolean {
    return isSameMapRect(was, current) && was.zoom === current.zoom;
}
