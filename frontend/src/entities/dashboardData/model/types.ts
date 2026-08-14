import type { components } from '@shared/api';

export type DashboardData = components['schemas']['DashboardResponse'];

export type DashboardTotals = DashboardData['totals'];

export type DashboardFlightsByPhase = DashboardData['flightsByPhase'];

export type DashboardBusiestAirport = DashboardData['topBusiestAirports'][number];

export type DashboardTrafficTrendPoint = DashboardData['trafficTrend'][number];
