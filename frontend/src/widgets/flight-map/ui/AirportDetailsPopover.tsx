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
    isLoading: boolean;
    open: boolean;
    tooltipContent: ReactNode;
    onOpenChange: (airportId: string, open: boolean) => void;
}

export function AirportDetailsPopover({
    airport,
    children,
    details,
    isLoading,
    open,
    tooltipContent,
    onOpenChange,
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

    let content: ReactNode = null;

    if (isLoading) {
        content = (
            <div className={styles.message} role="status" aria-live="polite">
                <Spin size="l" />
                <span>Загружаем рейсы аэропорта</span>
            </div>
        );
    } else if (details) {
        content = <AirportDetailsCard airport={airport} details={details} />;
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
