import { Xmark } from '@gravity-ui/icons';
import { Button, Icon, Spin } from '@gravity-ui/uikit';
import type { Airport } from '@entities/airport';
import type { AirportFlightsResponse } from '@features/getAirportsFlights';
import { AirportDetailsCard } from './AirportDetailsCard';
import styles from './AirportDetails.module.css';

interface AirportDetailsContentProps {
    airport: Airport;
    details: AirportFlightsResponse | null;
    isError: boolean;
    isLoading: boolean;
    onClose?: () => void;
    onRetry: () => void;
}

export function AirportDetailsContent({
    airport,
    details,
    isError,
    isLoading,
    onClose,
    onRetry,
}: AirportDetailsContentProps) {
    let content;

    if (isLoading) {
        content = (
            <div className={styles.message} role="status" aria-live="polite">
                <Spin size="l" />
                <span>Загружаем рейсы аэропорта</span>
            </div>
        );
    } else if (isError) {
        content = (
            <div className={styles.message} role="alert">
                <span>Не удалось загрузить рейсы аэропорта</span>
                <Button view="normal" size="s" onClick={onRetry}>
                    Повторить
                </Button>
            </div>
        );
    } else if (details) {
        content = <AirportDetailsCard airport={airport} details={details} />;
    } else {
        content = (
            <div className={styles.message} role="alert">
                Не удалось загрузить рейсы аэропорта
            </div>
        );
    }

    return (
        <div className={styles.content}>
            {onClose && (
                <Button
                    className={styles.closeButton}
                    view="flat"
                    size="s"
                    aria-label="Закрыть"
                    onClick={onClose}
                >
                    <Icon data={Xmark} size={16} />
                </Button>
            )}
            {content}
        </div>
    );
}
