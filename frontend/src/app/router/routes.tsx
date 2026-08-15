import { createBrowserRouter, Navigate } from 'react-router';
import { Layout } from '@/pages/layout';
import {
    dashboardDataQueryOptions,
    parseDashboardRange,
    toDashboardQuery,
} from '@/features/getDashboardData';
import { queryClient } from '@shared/api';
import { PageLoader, RouterErrorFallback } from '@shared/ui';
import { NotFoundPage } from '@/pages/notFound';

export const router = createBrowserRouter([
    {
        path: '/',
        Component: Layout,
        ErrorBoundary: RouterErrorFallback,
        HydrateFallback: PageLoader,
        children: [
            { index: true, element: <Navigate to="/map" replace /> },
            {
                path: 'map',
                lazy: {
                    Component: async () => {
                        const { MapPage } = await import('@pages/map');

                        return () => <MapPage theme="dark" />;
                    },
                },
                ErrorBoundary: RouterErrorFallback,
            },
            {
                path: 'dashboard',
                lazy: {
                    Component: async () => (await import('@/pages/dashboard')).DashboardPage,
                },
                ErrorBoundary: RouterErrorFallback,
                loader: ({ request }) => {
                    const { searchParams } = new URL(request.url);
                    const params = toDashboardQuery(parseDashboardRange(searchParams));
                    void queryClient.prefetchQuery(dashboardDataQueryOptions(params));

                    return null;
                },
            },
            { path: '*', element: <NotFoundPage />, ErrorBoundary: RouterErrorFallback },
        ],
    },
]);
