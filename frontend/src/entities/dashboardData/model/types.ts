import type { DashboardData } from './legacy-types';

export type { DashboardData };

export type DashboardTotals = DashboardData['totals'];

export type DashboardFlightsByPhase = DashboardData['flightsByPhase'];

export type DashboardBusiestAirport = DashboardData['topBusiestAirports'][number];

export type DashboardTrafficTrendPoint = DashboardData['trafficTrend'][number];
