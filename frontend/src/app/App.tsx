import { ThemeProvider } from '@gravity-ui/uikit';
import { RouterProvider } from 'react-router/dom';
import { MapViewProvider } from '@/shared/contexts/map-view';
import styles from './App.module.css';
import { QueryProvider } from './providers';
import { router } from './router/routes';
import './styles/index.css';
import { RootErrorFallback } from '@/shared/ui';
import { ErrorBoundary } from 'react-error-boundary';

export function App() {
    return (
        <QueryProvider>
            <ThemeProvider theme="light">
                {/* Контект хранит значение зума и координаты центральной точки на карте */}
                <ErrorBoundary FallbackComponent={RootErrorFallback}>
                    <MapViewProvider>
                        <div className={styles.app}>
                            <RouterProvider router={router} />
                        </div>
                    </MapViewProvider>
                </ErrorBoundary>
            </ThemeProvider>
        </QueryProvider>
    );
}
