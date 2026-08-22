import type { components, paths } from '@shared/api';

export type DashboardData =
    paths['/stats/dashboard']['get']['responses'][200]['content']['application/json'];

export type DashboardTotals = components['schemas']['Totals'];

export type DashboardFlightsByPhase = components['schemas']['FlightsByPhase'];

export type DashboardBusiestAirport = components['schemas']['BusiestAirport'];

export type DashboardTrafficTrendPoint = components['schemas']['TrafficTrendPoint'];

export type AirportsTraffic =
    paths['/stats/airports']['get']['responses'][200]['content']['application/json'];

export type AirportTraffic = components['schemas']['AirportTraffic'];
