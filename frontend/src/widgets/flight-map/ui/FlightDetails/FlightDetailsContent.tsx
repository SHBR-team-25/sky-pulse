import { Xmark } from '@gravity-ui/icons';
import { Button, Icon, Spin } from '@gravity-ui/uikit';
import type { Flight } from '@entities/flight';
import { FlightDetailsCard } from './FlightDetailsCard';
import styles from './FlightDetails.module.css';

interface FlightDetailsContentProps {
    flight: Flight | null;
    isLoading: boolean;
    onClose?: () => void;
}

export function FlightDetailsContent({ flight, isLoading, onClose }: FlightDetailsContentProps) {
    let content;

    if (isLoading) {
        content = (
            <div className={styles.message} role="status" aria-live="polite">
                <Spin size="l" />
                <span>Загружаем данные о рейсе</span>
            </div>
        );
    } else if (flight) {
        content = <FlightDetailsCard flight={flight} />;
    } else {
        content = (
            <div className={styles.message} role="alert">
                Не удалось загрузить данные
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
