import type { components } from '@/shared/types/api';

// TODO: вынести в enitities
export type Flight = components['schemas']['LiveFlightsResponse']['flights'][number];
export type Airport = components['schemas']['AirportsListResponse']['items'][number];
export type FlightDetails = components['schemas']['FlightDetailsResponse'];
