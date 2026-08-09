import { AppFooter } from '@/widgets/app-footer';
import { AppHeader } from '@/widgets/app-header';
import { Outlet } from 'react-router';

export function Layout() {
    return (
        <>
            <AppHeader />
            <Outlet />
            <AppFooter />
        </>
    );
}
