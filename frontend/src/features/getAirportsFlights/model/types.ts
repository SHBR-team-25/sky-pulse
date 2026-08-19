import type { AirportFlightsDirection } from '@/entities/airport';

/**
 * Ручки `GET /airports/{icao}/flights` нет в `docs/openapi.yaml` — query расписан руками
 * по прошлой версии спеки. Подробности в `entities/airport/model/legacy-flight-types.ts`.
 */
export type AirportFlightsQuery = {
    direction?: AirportFlightsDirection;
    from?: number;
    to?: number;
};

export type { AirportFlightsResponse } from '@/entities/airport';
