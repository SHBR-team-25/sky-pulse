import { ThemeProvider } from '@gravity-ui/uikit';
import { MapPage } from '@pages/map';
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
            </ThemeProvider>
        </QueryProvider>
    );
}
