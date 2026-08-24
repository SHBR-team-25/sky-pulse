import type { AirportFlightsDirection } from '@entities/airport';

/** Query ручки `GET /airports/{icao}/flights`: окно фиксировано сервером, есть только направление. */
export type AirportFlightsQuery = {
    direction?: AirportFlightsDirection;
};

export type { AirportFlightsResponse } from '@entities/airport';
