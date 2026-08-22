import type { AirportTraffic, DashboardBusiestAirport } from '../model/types';

/** Сколько строк показываем в бейдже: `/stats/airports` отдаёт все аэропорты с событиями за сутки */
export const TOP_BUSIEST_AIRPORTS_LIMIT = 10;

/**
 * Приводит выдачу `/stats/airports` к форме `dashboard_top_airports`: схемы совпадают всем, кроме
 * имени поля с суммой рейсов. Список уже отсортирован ручкой по этой сумме, пересортировка не нужна.
 */
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
