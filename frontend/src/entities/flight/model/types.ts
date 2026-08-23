import type { components } from '@shared/api';

/** Борт из `GET /flights/live` и `GET /flights/{icao24}` */
export type Flight = components['schemas']['Flight'];

/** Точка трека из `GET /flights/{icao24}/track` */
export type TrackPoint = components['schemas']['TrackPoint'];
