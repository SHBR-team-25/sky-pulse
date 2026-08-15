import type { LngLatBounds } from '@yandex/ymaps3-types';
import type { LiveFlightsQuery } from '@/features/getLiveFlights';

const COORDINATE_PRECISION = 10;

const LAT_LIMIT = 90;
const LON_LIMIT = 180;
const WORLD_LON_SPAN = 360;

const QUERY_KEYS = ['lonMin', 'latMin', 'lonMax', 'latMax', 'zoom', 'limit'] as const;

function clamp(value: number, limit: number): number {
    return Math.min(Math.max(value, -limit), limit);
}

function quantizeMin(value: number): number {
    return Math.floor(value * COORDINATE_PRECISION) / COORDINATE_PRECISION;
}

function quantizeMax(value: number): number {
    return Math.ceil(value * COORDINATE_PRECISION) / COORDINATE_PRECISION;
}

// Приводит долготу к диапазону [-180, 180)
function normalizeLon(lon: number): number {
    return ((((lon + LON_LIMIT) % WORLD_LON_SPAN) + WORLD_LON_SPAN) % WORLD_LON_SPAN) - LON_LIMIT;
}

interface BboxSource {
    bounds: LngLatBounds;
    zoom: number;
}

// Все округления нужны для стабильности queryKey, иначе react-query дёргал бы сеть непрерывно
export function toBboxParams({ bounds, zoom }: BboxSource): LiveFlightsQuery {
    const [[lonWest, latFirst], [lonEast, latSecond]] = bounds;
    // Целое значение стабилизирует queryKey
    const roundedZoom = Math.round(zoom);

    if (lonEast - lonWest >= WORLD_LON_SPAN) {
        return { zoom: roundedZoom };
    }

    const normalizedWest = normalizeLon(lonWest);
    const normalizedEast = normalizeLon(lonEast);

    if (normalizedWest > normalizedEast) {
        return { zoom: roundedZoom };
    }

    // clamp - округляет до предлов [-180, 180) и [-90, 90)
    return {
        lonMin: clamp(quantizeMin(normalizedWest), LON_LIMIT),
        latMin: clamp(quantizeMin(Math.min(latFirst, latSecond)), LAT_LIMIT),
        lonMax: clamp(quantizeMax(normalizedEast), LON_LIMIT),
        latMax: clamp(quantizeMax(Math.max(latFirst, latSecond)), LAT_LIMIT),
        zoom: roundedZoom,
    };
}

export function isSameQuery(left: LiveFlightsQuery, right: LiveFlightsQuery): boolean {
    return QUERY_KEYS.every((key) => left[key] === right[key]);
}
