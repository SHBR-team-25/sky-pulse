import { AppFooter } from '@/widgets/app-footer';
import { AppHeader } from '@/widgets/app-header';
import { PageLoader } from '@/shared/ui';
import { Suspense } from 'react';
import { Outlet } from 'react-router';

export function Layout() {
    return (
        <>
            <AppHeader />
            <Suspense fallback={<PageLoader />}>
                <Outlet />
            </Suspense>
            <AppFooter />
        </>
    );
}
