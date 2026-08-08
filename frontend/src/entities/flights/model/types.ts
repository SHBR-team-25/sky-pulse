import type { components, paths } from '@shared/api';

export type LiveFlightsQuery = NonNullable<paths['/flights/live']['get']['parameters']['query']>;

export type LiveFlightsResponse = components['schemas']['LiveFlightsResponse'];

export type LiveFlight = LiveFlightsResponse['flights'][number];

/** 'solo' — один борт, 'multie' — кластер*/
export type LiveFlightType = LiveFlight['type'];

export type FlightDetailsResponse = components['schemas']['FlightDetailsResponse'];

export type FlightTrackPoint = FlightDetailsResponse['path'][number];

export type AircraftPosition = components['schemas']['AircraftPosition'];

export type FlightPhase = components['schemas']['FlightPhase'];
