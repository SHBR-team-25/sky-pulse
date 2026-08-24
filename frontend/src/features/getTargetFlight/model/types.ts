import type { Flight, TrackPoint } from '@entities/flight';

/** Всё, что нужно карточке борта: позиция плюс трек для линии на карте. */
export interface TargetFlight {
    flight: Flight;
    track: TrackPoint[];
}
