import type { AirportTraffic, DashboardBusiestAirport } from '../model/types';

export const TOP_BUSIEST_AIRPORTS_LIMIT = 10;

export function toBusiestAirports(
    items: AirportTraffic[],
    limit = TOP_BUSIEST_AIRPORTS_LIMIT
): DashboardBusiestAirport[] {
    return items.slice(0, limit).map(({ airport, departures, arrivals, totalFlights24h }) => ({
        airport,
        departures,
        arrivals,
        totalFlights: totalFlights24h,
    }));
}
