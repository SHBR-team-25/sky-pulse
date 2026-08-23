import type { DashboardData } from './types';

const MOCK_FROM = 1_785_492_000;
const MOCK_TO = 1_785_578_400;

/** Точек на графике трафика: больше не имеет смысла, ось становится нечитаемой */
const MAX_TREND_POINTS = 48;
const MIN_TREND_POINTS = 8;

const HOUR = 3_600;

export const dashboardMock = {
    computedAt: MOCK_TO,
    totals: {
        activeFlights: 8_432,
        trackedAirports: 1_247,
        averageAltitudeM: 9_215.4,
        averageSpeedKmh: 812.7,
    },
    flightsByPhase: {
        onGround: 1_936,
        airborne: 8_432,
        climbing: 1_412,
        descending: 1_275,
    },
    topBusiestAirports: [
        {
            airport: { icao: 'UUEE', iata: 'SVO', name: 'Sheremetyevo International Airport' },
            departures: 371,
            arrivals: 371,
            totalFlights: 742,
        },
        {
            airport: { icao: 'UUDD', iata: 'DME', name: 'Domodedovo International Airport' },
            departures: 307,
            arrivals: 308,
            totalFlights: 615,
        },
        {
            airport: { icao: 'UUWW', iata: 'VKO', name: 'Vnukovo International Airport' },
            departures: 254,
            arrivals: 254,
            totalFlights: 508,
        },
        {
            airport: { icao: 'ULLI', iata: 'LED', name: 'Pulkovo Airport' },
            departures: 235,
            arrivals: 236,
            totalFlights: 471,
        },
        {
            airport: { icao: 'USSS', iata: 'SVX', name: 'Koltsovo International Airport' },
            departures: 168,
            arrivals: 168,
            totalFlights: 336,
        },
    ],
    busiestRoutes: [],
    aircraftByManufacturer: [],
    topCountries: [],
    topAirlines: [],
    trafficTrend: buildTrafficTrend(MOCK_FROM, MOCK_TO),
    emergencyCount: 3,
} satisfies DashboardData;

/** Пустой ответ: период без данных. Полезно для проверки нулевых состояний UI */
export const emptyDashboardMock = {
    computedAt: MOCK_TO,
    totals: {
        activeFlights: 0,
        trackedAirports: 0,
        averageAltitudeM: null,
        averageSpeedKmh: null,
    },
    flightsByPhase: { onGround: 0, airborne: 0, climbing: 0, descending: 0 },
    topBusiestAirports: [],
    busiestRoutes: [],
    aircraftByManufacturer: [],
    topCountries: [],
    topAirlines: [],
    trafficTrend: [],
    emergencyCount: 0,
} satisfies DashboardData;

/**
 * Мок дашборда под произвольный период (from/to — unix ts). Ручка периода не принимает, окно нужно
 * только чтобы построить тренд. Детерминирован: одинаковый диапазон всегда даёт одинаковые числа,
 * поэтому значения не «прыгают» на ре-рендерах.
 */
export function makeDashboardMock(from: number, to: number): DashboardData {
    const [start, end] = from <= to ? [from, to] : [to, from];

    const trafficTrend = buildTrafficTrend(start, end);
    const activeFlights = trafficTrend.at(-1)?.activeFlights ?? 0;
    const phaseTotal = Math.round(activeFlights * 1.23);

    return {
        computedAt: end,
        totals: {
            activeFlights,
            trackedAirports: 1_180 + Math.round(pseudoRandom(start) * 120),
            averageAltitudeM: round(8_600 + pseudoRandom(start + 1) * 1_400, 1),
            averageSpeedKmh: round(760 + pseudoRandom(start + 2) * 120, 1),
        },
        flightsByPhase: {
            onGround: phaseTotal - activeFlights,
            airborne: activeFlights,
            climbing: Math.round(activeFlights * 0.17),
            descending: Math.round(activeFlights * 0.15),
        },
        topBusiestAirports: dashboardMock.topBusiestAirports.map((item, index) => {
            const totalFlights = Math.max(
                1,
                Math.round(item.totalFlights * (0.7 + pseudoRandom(start + index) * 0.6))
            );
            const departures = Math.round(totalFlights / 2);

            return {
                airport: item.airport,
                departures,
                arrivals: totalFlights - departures,
                totalFlights,
            };
        }),
        busiestRoutes: [],
        aircraftByManufacturer: [],
        topCountries: [],
        topAirlines: [],
        trafficTrend,
        emergencyCount: Math.round(pseudoRandom(start + 3) * 5),
    };
}

/**
 * Тайм-серия с суточной волной: минимум трафика ночью, пик днём.
 * Шаг подбирается под длину периода, чтобы точек было не больше MAX_TREND_POINTS.
 */
function buildTrafficTrend(from: number, to: number): DashboardData['trafficTrend'] {
    const duration = Math.max(to - from, HOUR);
    const pointCount = clamp(Math.round(duration / HOUR), MIN_TREND_POINTS, MAX_TREND_POINTS);
    const step = Math.round(duration / pointCount);

    return Array.from({ length: pointCount + 1 }, (_, index) => {
        const timestamp = from + step * index;
        const hourOfDay = ((timestamp % 86_400) / 86_400) * Math.PI * 2;
        const daily = Math.sin(hourOfDay - Math.PI / 2);
        const noise = pseudoRandom(timestamp) - 0.5;

        return {
            timestamp,
            activeFlights: Math.round(7_000 + daily * 2_200 + noise * 600),
        };
    });
}

/** Детерминированный «шум» в диапазоне [0, 1) на основе seed */
function pseudoRandom(seed: number): number {
    const value = Math.sin(seed * 12.9898) * 43_758.545_3;

    return value - Math.floor(value);
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

function round(value: number, digits: number): number {
    const factor = 10 ** digits;

    return Math.round(value * factor) / factor;
}
