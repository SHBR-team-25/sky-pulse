import { ThemeProvider } from '@gravity-ui/uikit';
import { RouterProvider } from 'react-router/dom';
import styles from './App.module.css';
import { QueryProvider } from './providers';
import { router } from './router/routes';
import './styles/index.css';
import { RootErrorFallback } from '@/shared/ui';
import { ErrorBoundary } from 'react-error-boundary';

export function App() {
    return (
        <QueryProvider>
            <ThemeProvider theme="dark">
                <ErrorBoundary FallbackComponent={RootErrorFallback}>
                    <div className={styles.app}>
                        <RouterProvider router={router} />
                    </div>
                </ErrorBoundary>
            </ThemeProvider>
        </QueryProvider>
    );
}
