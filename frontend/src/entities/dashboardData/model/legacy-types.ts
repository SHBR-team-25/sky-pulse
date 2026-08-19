/**
 * Замороженный контракт ручки `GET /stats/dashboard`.
 *
 * Ручки нет в `docs/openapi.yaml`: считать агрегаты positions-service не из чего —
 * в пайплайне нет таблиц рейсов. Типы перенесены руками из прошлой версии спеки,
 * чтобы дашборд продолжал жить на моках и компилироваться.
 *
 * Когда ручка появится на бэкенде — удалить файл и вернуться к `components['schemas']`.
 */

/**
 * Дубль `AirportRef` из `entities/airport/model/legacy-flight-types.ts`: импортировать
 * оттуда нельзя, FSD-границы запрещают зависимости между entities. Оба контракта
 * заморожены и удалятся вместе, так что дубль недолговечен.
 */
interface AirportRef {
    icao: string;
    iata: string | null;
    name: string;
}

export interface DashboardData {
    /** unix ts, начало окна агрегации */
    from: number;
    /** unix ts, конец окна агрегации */
    to: number;
    totals: {
        activeFlights: number;
        trackedAirports: number;
        averageAltitudeM: number;
        averageSpeedKmh: number;
    };
    flightsByPhase: {
        on_ground: number;
        climbing: number;
        descending: number;
        cruising: number;
    };
    topBusiestAirports: {
        airport: AirportRef;
        totalFlights: number;
    }[];
    /** Тайм-серия по снапшотам */
    trafficTrend: {
        timestamp: number;
        activeFlights: number;
    }[];
    /** Количество случаев с squawk=7700 или squawk=7500 */
    emergencyCount: number;
}
