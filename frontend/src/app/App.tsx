import { RouterProvider } from 'react-router/dom';
import { AppThemeProvider } from '@shared/contexts/theme';
import styles from './App.module.css';
import { QueryProvider } from './providers';
import { router } from './router/routes';
import './styles/index.css';
import { RootErrorFallback } from '@shared/ui';
import { ErrorBoundary } from 'react-error-boundary';

export function App() {
    return (
        <QueryProvider>
            <AppThemeProvider>
                {/* Контект хранит значение зума и координаты центральной точки на карте */}
                <ErrorBoundary FallbackComponent={RootErrorFallback}>
                    <div className={styles.app}>
                        <RouterProvider router={router} />
                    </div>
                </ErrorBoundary>
            </AppThemeProvider>
        </QueryProvider>
    );
}
