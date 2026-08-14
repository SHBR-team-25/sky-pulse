import {
    cloneElement,
    useCallback,
    useEffect,
    type HTMLAttributes,
    type ReactElement,
    type ReactNode,
    type RefAttributes,
} from 'react';
import { Popover, Spin } from '@gravity-ui/uikit';
import type { Airport, AirportFlightsDirection } from '@/entities/airport';
import type { AirportFlightsResponse } from '@/features/getAirportsFlights';
import { AirportDetailsCard } from './AirportDetailsCard';
import { MarkerTooltip } from './MarkerTooltip';
import styles from './AirportDetailsPopover.module.css';

type MarkerElementProps = HTMLAttributes<HTMLElement> & RefAttributes<HTMLElement>;

interface AirportDetailsPopoverProps {
    airport: Airport;
    children: ReactElement<MarkerElementProps>;
    details: AirportFlightsResponse | null;
    direction: AirportFlightsDirection;
    isLoading: boolean;
    open: boolean;
    tooltipContent: ReactNode;
    onDirectionChange: (airportId: string, direction: AirportFlightsDirection) => void;
    onOpenChange: (airportId: string, open: boolean) => void;
}

export function AirportDetailsPopover({
    airport,
    children,
    details,
    direction,
    isLoading,
    open,
    tooltipContent,
    onDirectionChange,
    onOpenChange,
}: AirportDetailsPopoverProps) {
    const handleOpenChange = useCallback(
        (nextOpen: boolean) => onOpenChange(airport.icao, nextOpen),
        [airport.icao, onOpenChange]
    );
    const handleDirectionChange = useCallback(
        (nextDirection: AirportFlightsDirection) => onDirectionChange(airport.icao, nextDirection),
        [airport.icao, onDirectionChange]
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
        content = (
            <AirportDetailsCard
                airport={airport}
                details={details}
                direction={direction}
                onDirectionChange={handleDirectionChange}
            />
        );
    }

    return (
        <Popover
            className={styles.popover}
            content={content}
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
