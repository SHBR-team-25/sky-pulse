import { ThemeProvider } from '@gravity-ui/uikit';
import { MapPage } from '@pages/map';
import { MapViewProvider } from '@/shared/contexts/map-view';
import styles from './App.module.css';
import { QueryProvider } from './providers';
import './styles/index.css';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { DashboardPage } from '@/pages/dashboard';
import { Layout } from '@/pages/layout';

export function App() {
    return (
        <QueryProvider>
            <ThemeProvider theme="dark">
                {/* Контект хранит значение зума и координаты центральной точки на карте */}
                <MapViewProvider>
                    <div className={styles.app}>
                        <BrowserRouter>
                            <Routes>
                                <Route path="/" element={<Layout />}>
                                    <Route index element={<Navigate to="/map" replace />} />
                                    <Route path="map" element={<MapPage theme="dark" />} />
                                    <Route path="dashboard" element={<DashboardPage />} />
                                </Route>
                            </Routes>
                        </BrowserRouter>
                    </div>
                </MapViewProvider>
            </ThemeProvider>
        </QueryProvider>
    );
}
