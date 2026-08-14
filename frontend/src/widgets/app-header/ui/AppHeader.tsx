// import { Magnifier } from '@gravity-ui/icons';
import { Button } from '@gravity-ui/uikit';
import { NavLink } from 'react-router';
import { useUtcTime } from '@/shared/hooks';
import styles from './AppHeader.module.css';

export function AppHeader() {
    const { utcTime, utcDateTime } = useUtcTime();

    return (
        <header className={styles.header}>
            <div className={styles.brand} aria-label="SkyPulse">
                {/* <span className={styles.logo} aria-hidden="true">
                    <span className={styles.logoMark} />
                </span> */}
                <span className={styles.productName}>SkyPulse</span>
            </div>

            {/* TODO: сделать, если будем делать поиск по самолетам, аэропортам  */}
            {/* <TextInput
                className={styles.search}
                aria-label="Поиск"
                placeholder={headerMock.searchPlaceholder}
                size="l"
                startContent={<Icon data={Magnifier} size={16} />}
                endContent={<kbd className={styles.shortcut}>{headerMock.searchShortcut}</kbd>}
            /> */}

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
                <time className={styles.utcTime} dateTime={utcDateTime}>
                    {utcTime}
                </time>
            </div>
        </header>
    );
}
