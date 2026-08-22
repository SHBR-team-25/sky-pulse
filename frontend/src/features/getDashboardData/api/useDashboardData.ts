import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import type { AirportsTraffic, DashboardData } from '@entities/dashboardData';
import { fetchJson } from '@shared/api';

export const dashboardDataQueryKeys = {
    all: ['dashboard-data'] as const,
    stats: () => [...dashboardDataQueryKeys.all, 'stats'] as const,
};

export type DashboardDataWithAirports = DashboardData & {
    airportsTraffic: AirportsTraffic | null;
};

export function dashboardDataQueryOptions() {
    return queryOptions({
        queryKey: dashboardDataQueryKeys.stats(),
        queryFn: async ({ signal }): Promise<DashboardDataWithAirports> => {
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
        refetchInterval: 120_000,
    });
}

export function useDashboardData() {
    return useSuspenseQuery(dashboardDataQueryOptions());
}
