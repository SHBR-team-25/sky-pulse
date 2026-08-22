// import { Magnifier } from '@gravity-ui/icons';
import { Moon, Sun } from '@gravity-ui/icons';
import { Button, Icon, Switch } from '@gravity-ui/uikit';
import { NavLink } from 'react-router';
import { useUtcTime } from '@/shared/hooks';
import { useAppTheme } from '@/shared/contexts/theme';
import styles from './AppHeader.module.css';

export function AppHeader() {
    const { utcTime, utcDateTime } = useUtcTime();
    const { theme, toggleTheme } = useAppTheme();
    const isDarkTheme = theme === 'dark';
    const nextThemeLabel = isDarkTheme ? 'Включить светлую тему' : 'Включить тёмную тему';

    return (
        <header className={styles.header}>
            <div className={styles.brand} aria-label="SkyPulse">
                <img className={styles.logo} src="/yt_logo.webp" alt="" width={26} height={26} />
                <span className={styles.productName}>SkyPulse</span>
            </div>

            <nav className={styles.navigation} aria-label="Основная навигация">
                <Button
                    key="Карта"
                    component={NavLink}
                    to="/map"
                    className={styles.navigationButton}
                    view="flat"
                    size="m"
                >
                    Карта
                </Button>
                <Button
                    key="Статистика"
                    component={NavLink}
                    to="/dashboard"
                    className={styles.navigationButton}
                    view="flat"
                    size="m"
                >
                    Статистика
                </Button>
            </nav>

            <div className={styles.status}>
                {/* <div className={styles.liveStatus}>
                    <span className={styles.liveDot} aria-hidden="true" />
                    <span>{headerMock.liveLabel}</span>
                </div> */}
                <Switch
                    className={styles.themeToggle}
                    size="l"
                    checked={isDarkTheme}
                    title={nextThemeLabel}
                    controlProps={{ 'aria-label': nextThemeLabel }}
                    onUpdate={toggleTheme}
                >
                    <span className={styles.themeToggleIcons} aria-hidden="true">
                        <span className={`${styles.themeToggleIcon} ${styles.themeToggleSun}`}>
                            <Icon data={Sun} size={14} />
                        </span>
                        <span className={`${styles.themeToggleIcon} ${styles.themeToggleMoon}`}>
                            <Icon data={Moon} size={14} />
                        </span>
                    </span>
                </Switch>
                <time className={styles.utcTime} dateTime={utcDateTime}>
                    {utcTime}
                </time>
            </div>
        </header>
    );
}
