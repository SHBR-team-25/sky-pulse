import { ThemeProvider } from '@gravity-ui/uikit';
import { MapPage } from '../pages/map';
import { AppFooter } from '../widgets/app-footer';
import { AppHeader } from '../widgets/app-header';
import styles from './App.module.css';
import './styles/index.css';

export function App() {
    return (
        <ThemeProvider theme="dark">
            <div className={styles.app}>
                <AppHeader />
                <MapPage />
                <AppFooter />
            </div>
        </ThemeProvider>
    );
}
