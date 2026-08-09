import type { components } from '@shared/api';

export type LiveFlight = components['schemas']['LiveFlightsResponse']['flights'][number];

/** 'solo' — один борт, 'multie' — кластер*/
export type LiveFlightType = LiveFlight['type'];

export type FlightTrackPoint = components['schemas']['FlightDetailsResponse']['path'][number];

export type AircraftPosition = components['schemas']['AircraftPosition'];

export type FlightPhase = components['schemas']['FlightPhase'];
