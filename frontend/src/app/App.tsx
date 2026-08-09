import { ThemeProvider } from '@gravity-ui/uikit';
import { MapPage } from '@pages/map';
import { AppFooter } from '@widgets/app-footer';
import { AppHeader } from '@widgets/app-header';
import { MapViewProvider } from '@/shared/contexts/map-view';
import styles from './App.module.css';
import { QueryProvider } from './providers';
import './styles/index.css';

export function App() {
    return (
        <QueryProvider>
            <ThemeProvider theme="dark">
                {/* Контект хранит значение зума и координаты центральной точки на карте */}
                <MapViewProvider>
                    <div className={styles.app}>
                        <AppHeader />
                        <MapPage theme="dark" />
                        <AppFooter />
                    </div>
                </MapViewProvider>
            </ThemeProvider>
        </QueryProvider>
    );
}
