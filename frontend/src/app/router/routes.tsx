import { createBrowserRouter, Navigate } from 'react-router';
import { Layout } from '@/pages/layout';
import { dashboardDataQueryOptions } from '@/features/getDashboardData';
import { airportsQueryOptions, toAirportsMapQuery } from '@/features/getAirports';
import { liveFlightsQueryOptions } from '@/features/getLiveFlights';
import { queryClient } from '@shared/api';
import {
    parseMapBoundsView,
    resolveMapSearchParams,
    toMapBoundsParams,
} from '@/shared/contexts/map-view';
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
                loader: ({ request }) => {
                    const { searchParams } = new URL(request.url);
                    const view = parseMapBoundsView(resolveMapSearchParams(searchParams));
                    const params = toMapBoundsParams(view);
                    void queryClient.prefetchQuery(liveFlightsQueryOptions(params));
                    void queryClient.prefetchQuery(
                        airportsQueryOptions(toAirportsMapQuery(params))
                    );

                    return null;
                },
            },
            {
                path: 'dashboard',
                lazy: {
                    Component: async () => (await import('@/pages/dashboard')).DashboardPage,
                },
                ErrorBoundary: RouterErrorFallback,
                loader: () => {
                    void queryClient.prefetchQuery(dashboardDataQueryOptions());

                    return null;
                },
            },
            { path: '*', element: <NotFoundPage />, ErrorBoundary: RouterErrorFallback },
        ],
    },
]);
