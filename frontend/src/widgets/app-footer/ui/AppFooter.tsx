import { footerMock } from '../model/mock-data';
import styles from './AppFooter.module.css';

export function AppFooter() {
    return (
        <footer className={styles.footer}>
            <ul className={styles.statusList} aria-label="Статусы рейсов">
                {footerMock.flightStatuses.map((status) => (
                    <li className={styles.statusItem} key={status.label}>
                        <span
                            className={`${styles.statusDot} ${styles[status.tone]}`}
                            aria-hidden="true"
                        />
                        <span>
                            {status.label} · {status.value}
                        </span>
                    </li>
                ))}
            </ul>

            <ul className={styles.technicalInfo} aria-label="Параметры карты">
                {footerMock.technicalInfo.map((item) => (
                    <li key={item}>{item}</li>
                ))}
            </ul>
        </footer>
    );
}
