import { ThemeProvider } from '@gravity-ui/uikit';
import { RouterProvider } from 'react-router/dom';
import { MapViewProvider } from '@/shared/contexts/map-view';
import styles from './App.module.css';
import { QueryProvider } from './providers';
import { router } from './router/routes';
import './styles/index.css';

export function App() {
    return (
        <QueryProvider>
            <ThemeProvider theme="dark">
                {/* Контект хранит значение зума и координаты центральной точки на карте */}
                <MapViewProvider>
                    <div className={styles.app}>
                        <RouterProvider router={router} />
                    </div>
                </MapViewProvider>
            </ThemeProvider>
        </QueryProvider>
    );
}
