import { AppFooter } from '@widgets/app-footer';
import { AppHeader } from '@widgets/app-header';
import { PageLoader } from '@shared/ui';
import { MapViewProvider } from '@shared/contexts/map-view';
import { MetrikaPageTracker } from '@shared/lib/metrika';
import { Suspense } from 'react';
import { Outlet } from 'react-router';

export function Layout() {
    return (
        // контекст хранит зум и координаты центра карты, инициализируется из адресной строки
        <MapViewProvider>
            <MetrikaPageTracker />
            <AppHeader />
            <Suspense fallback={<PageLoader />}>
                <Outlet />
            </Suspense>
            <AppFooter />
        </MapViewProvider>
    );
}
