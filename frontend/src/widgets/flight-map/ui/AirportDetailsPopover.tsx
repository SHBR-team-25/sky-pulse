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
import type { Airport } from '@/entities/airport';
import type { AirportFlightsResponse } from '@/features/getAirportsFlights';
import { AirportDetailsCard } from './AirportDetailsCard';
import { MarkerTooltip } from './MarkerTooltip';
import styles from './AirportDetailsPopover.module.css';

type MarkerElementProps = HTMLAttributes<HTMLElement> & RefAttributes<HTMLElement>;

interface AirportDetailsPopoverProps {
    airport: Airport;
    children: ReactElement<MarkerElementProps>;
    details: AirportFlightsResponse | null;
    isError: boolean;
    isLoading: boolean;
    open: boolean;
    tooltipContent: ReactNode;
    onOpenChange: (airportId: string, open: boolean) => void;
    onRetry: () => void;
}

export function AirportDetailsPopover({
    airport,
    children,
    details,
    isError,
    isLoading,
    open,
    tooltipContent,
    onOpenChange,
    onRetry,
}: AirportDetailsPopoverProps) {
    const handleOpenChange = useCallback(
        (nextOpen: boolean) => onOpenChange(airport.icao, nextOpen),
        [airport.icao, onOpenChange]
    );
    useEffect(
        () => () => {
            onOpenChange(airport.icao, false);
        },
        [airport.icao, onOpenChange]
    );

    let content: ReactNode;

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
                No details found
            </div>
        );
    }

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
                    {content}
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
