import {
    cloneElement,
    useCallback,
    useEffect,
    type HTMLAttributes,
    type ReactElement,
    type ReactNode,
    type RefAttributes,
} from 'react';
import { Xmark } from '@gravity-ui/icons';
import { Button, Icon, Popover, Spin } from '@gravity-ui/uikit';
import { FlightDetailsCard } from './FlightDetailsCard';
import styles from './FlightDetailsPopover.module.css';
import { MarkerTooltip } from './MarkerTooltip';
import type { Flight } from '@/entities/flight';

type MarkerElementProps = HTMLAttributes<HTMLElement> & RefAttributes<HTMLElement>;

interface FlightDetailsPopoverProps {
    children: ReactElement<MarkerElementProps>;
    flight: Flight | null;
    flightId: string;
    isLoading: boolean;
    open: boolean;
    tooltipContent: ReactNode;
    onOpenChange: (flightId: string, open: boolean) => void;
}

export function FlightDetailsPopover({
    children,
    flight,
    flightId,
    isLoading,
    open,
    tooltipContent,
    onOpenChange,
}: FlightDetailsPopoverProps) {
    const handleOpenChange = useCallback(
        (nextOpen: boolean) => onOpenChange(flightId, nextOpen),
        [flightId, onOpenChange]
    );

    useEffect(
        () => () => {
            onOpenChange(flightId, false);
        },
        [flightId, onOpenChange]
    );

    return (
        <Popover
            className={styles.popover}
            content={
                <div className={styles.content}>
                    <Button
                        className={styles.closeButton}
                        view="flat"
                        size="s"
                        aria-label="Закрыть"
                        onClick={() => handleOpenChange(false)}
                    >
                        <Icon data={Xmark} size={16} />
                    </Button>
                    {isLoading ? (
                        <div className={styles.message} role="status" aria-live="polite">
                            <Spin size="l" />
                            <span>Загружаем данные о рейсе</span>
                        </div>
                    ) : flight ? (
                        <FlightDetailsCard flight={flight} />
                    ) : (
                        <div className={styles.message} role="alert">
                            No details found
                        </div>
                    )}
                </div>
            }
            open={open}
            onOpenChange={handleOpenChange}
            trigger="click"
            placement="right"
            hasArrow={false}
        >
            {(popoverProps, popoverRef) => (
                <MarkerTooltip content={tooltipContent} disabled={open}>
                    {cloneElement(children, {
                        ...(popoverProps as MarkerElementProps),
                        ref: popoverRef,
                    })}
                </MarkerTooltip>
            )}
        </Popover>
    );
}
