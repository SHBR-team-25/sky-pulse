import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import type { AirportsTraffic, DashboardData } from '@entities/dashboardData';
import { fetchJson } from '@shared/api';

export const dashboardDataQueryKeys = {
    all: ['dashboard-data'] as const,
    stats: () => [...dashboardDataQueryKeys.all, 'stats'] as const,
};

export type DashboardDataWithAirports = DashboardData & {
    /** `null`, если ручка не ответила: бейджи откатываются на агрегаты из `/stats/dashboard` */
    airportsTraffic: AirportsTraffic | null;
};

export function dashboardDataQueryOptions() {
    return queryOptions({
        queryKey: dashboardDataQueryKeys.stats(),
        queryFn: async ({ signal }): Promise<DashboardDataWithAirports> => {
            /**
             * `/stats/airports` считает рейсы по `airport_events` и потому свежее агрегатов джобы,
             * но по спеке штатно отвечает 503, когда источник недоступен. Дашборд из-за этого
             * ронять нельзя, поэтому обязателен только `/stats/dashboard`.
             */
            const [dashboard, airports] = await Promise.allSettled([
                fetchJson<DashboardData>('/stats/dashboard', { signal }),
                fetchJson<AirportsTraffic>('/stats/airports', { signal }),
            ]);

            if (dashboard.status === 'rejected') {
                throw dashboard.reason;
            }

            return {
                ...dashboard.value,
                airportsTraffic: airports.status === 'fulfilled' ? airports.value : null,
            };
        },
    });
}

export function useDashboardData() {
    return useSuspenseQuery(dashboardDataQueryOptions());
}
