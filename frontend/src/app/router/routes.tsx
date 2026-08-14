import { createBrowserRouter, Navigate } from 'react-router';
import { MapPage } from '@pages/map';
import { DashboardPage } from '@/pages/dashboard';
import { Layout } from '@/pages/layout';
import {
    dashboardDataQueryOptions,
    parseDashboardRange,
    toDashboardQuery,
} from '@/features/getDashboardData';
import { queryClient } from '@shared/api';

export const router = createBrowserRouter([
    {
        path: '/',
        Component: Layout,
        children: [
            { index: true, element: <Navigate to="/map" replace /> },
            { path: 'map', element: <MapPage theme="dark" /> },
            {
                path: 'dashboard',
                Component: DashboardPage,
                loader: ({ request }) => {
                    const { searchParams } = new URL(request.url);
                    const params = toDashboardQuery(parseDashboardRange(searchParams));
                    void queryClient.prefetchQuery(dashboardDataQueryOptions(params));

                    return null;
                },
            },
            { path: '*', element: <Navigate to="/map" replace /> },
        ],
    },
]);
