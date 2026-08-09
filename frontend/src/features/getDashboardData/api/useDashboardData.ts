import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { DashboardQuery } from '../model/types';
import type { DashboardData } from '@entities/dashboardData';
import { fetchJson } from '@shared/api';

export const dashboardDataQueryKeys = {
    all: ['dashboard-data'] as const,
    stats: (params: DashboardQuery) => [...dashboardDataQueryKeys.all, 'stats', params] as const,
};

export function useDashboardData(params: DashboardQuery = {}) {
    return useQuery({
        queryKey: dashboardDataQueryKeys.stats(params),
        queryFn: () => fetchJson<DashboardData>('/stats/dashboard', { params }),
        placeholderData: keepPreviousData,
    });
}
