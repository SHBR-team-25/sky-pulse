import { Magnifier } from '@gravity-ui/icons';
import { Button, Icon, TextInput } from '@gravity-ui/uikit';
import { headerMock } from '../model/mock-data';
import styles from './AppHeader.module.css';

export function AppHeader() {
    return (
        <header className={styles.header}>
            <div className={styles.brand} aria-label={headerMock.productName}>
                {/* <span className={styles.logo} aria-hidden="true">
                    <span className={styles.logoMark} />
                </span> */}
                <span className={styles.productName}>{headerMock.productName}</span>
            </div>

            <TextInput
                className={styles.search}
                aria-label="Поиск"
                placeholder={headerMock.searchPlaceholder}
                size="l"
                startContent={<Icon data={Magnifier} size={16} />}
                endContent={<kbd className={styles.shortcut}>{headerMock.searchShortcut}</kbd>}
            />

            <nav className={styles.navigation} aria-label="Основная навигация">
                {headerMock.navigation.map((item) => (
                    <Button
                        key={item.label}
                        className={styles.navigationButton}
                        view="flat"
                        size="m"
                        selected={item.isActive}
                        aria-current={item.isActive ? 'page' : undefined}
                    >
                        {item.label}
                    </Button>
                ))}
            </nav>

            <div className={styles.status}>
                <div className={styles.liveStatus}>
                    <span className={styles.liveDot} aria-hidden="true" />
                    <span>{headerMock.liveLabel}</span>
                </div>
                <time className={styles.utcTime}>{headerMock.utcTime}</time>
            </div>
        </header>
    );
}
