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
        queryFn: async ({ client, queryKey, signal }): Promise<DashboardDataWithAirports> => {
            const [dashboard, airports] = await Promise.allSettled([
                fetchJson<DashboardData>('/stats/dashboard', { signal }),
                fetchJson<AirportsTraffic>('/stats/airports', { signal }),
            ]);

            if (dashboard.status === 'rejected') {
                throw dashboard.reason;
            }

            const previous = client.getQueryData<DashboardDataWithAirports>(queryKey);

            return {
                ...dashboard.value,
                airportsTraffic:
                    airports.status === 'fulfilled'
                        ? airports.value
                        : (previous?.airportsTraffic ?? null),
            };
        },
        refetchInterval: 120_000,
        refetchIntervalInBackground: false,
        refetchOnWindowFocus: true,
    });
}

export function useDashboardData() {
    return useSuspenseQuery(dashboardDataQueryOptions());
}
