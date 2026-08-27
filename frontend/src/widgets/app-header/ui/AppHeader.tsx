import { Moon, Sun } from '@gravity-ui/icons';
import { Button, Icon, Switch } from '@gravity-ui/uikit';
import { NavLink } from 'react-router';
import { useUtcTime } from '@shared/hooks';
import { useAppTheme } from '@shared/contexts/theme';
import logoPng from '../assets/yt_logo.png';
import logoWebp from '../assets/yt_logo.webp';
import styles from './AppHeader.module.css';

export function AppHeader() {
    const { utcTime, utcDateTime } = useUtcTime();
    const { theme, toggleTheme } = useAppTheme();
    const isDarkTheme = theme === 'dark';
    const nextThemeLabel = isDarkTheme ? 'Включить светлую тему' : 'Включить тёмную тему';

    return (
        <header className={styles.header}>
            <div className={styles.brand}>
                <picture className={styles.logoPicture}>
                    <source srcSet={logoWebp} type="image/webp" />
                    <img className={styles.logo} src={logoPng} alt="" width={26} height={26} />
                </picture>
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
