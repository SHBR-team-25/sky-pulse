import { AppFooter } from '@/widgets/app-footer';
import { AppHeader } from '@/widgets/app-header';
import { PageLoader } from '@/shared/ui';
import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router';

export function Layout() {
    const location = useLocation();

    return (
        <>
            <AppHeader />
            <Suspense key={location.pathname} fallback={<PageLoader />}>
                <Outlet />
            </Suspense>
            <AppFooter />
        </>
    );
}
