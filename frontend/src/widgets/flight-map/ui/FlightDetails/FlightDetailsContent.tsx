import { Xmark } from '@gravity-ui/icons';
import { Button, Icon, Spin } from '@gravity-ui/uikit';
import type { FlightDetailsResponse } from '@/features/getTargetFlight';
import { FlightDetailsCard } from './FlightDetailsCard';
import styles from './FlightDetails.module.css';

interface FlightDetailsContentProps {
    details: FlightDetailsResponse | null;
    isLoading: boolean;
    onClose?: () => void;
}

export function FlightDetailsContent({ details, isLoading, onClose }: FlightDetailsContentProps) {
    let content;

    if (isLoading) {
        content = (
            <div className={styles.message} role="status" aria-live="polite">
                <Spin size="l" />
                <span>Загружаем данные о рейсе</span>
            </div>
        );
    } else if (details) {
        content = <FlightDetailsCard details={details} />;
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
