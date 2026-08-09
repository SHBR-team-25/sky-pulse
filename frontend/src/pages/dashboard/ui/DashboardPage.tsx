import { Dashboard } from '@/widgets/dashboard';
import styles from './DashboardPage.module.css';

export function DashboardPage() {
    return (
        <main className={styles.dashboard} aria-label="Дашборд полётов">
            <Dashboard />
        </main>
    );
}
