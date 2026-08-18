import type { components } from '@shared/api';

export type LiveFlight = components['schemas']['LiveFlightsResponse']['flights'][number];

/** 'solo' — один борт, 'multie' — кластер*/
export type LiveFlightType = LiveFlight['type'];

export type FlightDetailsResponse = components['schemas']['FlightDetailsResponse'];

export type FlightDetails = Omit<FlightDetailsResponse, 'startTime' | 'endTime'> & {
    startTime: number | null;
    endTime: number | null;
};

export type FlightTrackPoint = FlightDetailsResponse['path'][number];

export type AircraftPosition = components['schemas']['AircraftPosition'];

export type FlightPhase = components['schemas']['FlightPhase'];
