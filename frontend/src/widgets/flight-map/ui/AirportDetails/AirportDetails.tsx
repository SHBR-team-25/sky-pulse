import {
    cloneElement,
    useEffect,
    type HTMLAttributes,
    type ReactElement,
    type ReactNode,
    type RefAttributes,
} from 'react';
import type { Airport } from '@/entities/airport';
import type { AirportFlightsResponse } from '@/features/getAirportsFlights';
import { MEDIA_QUERIES } from '@/shared/config';
import { useMediaQuery } from '@/shared/hooks';
import { AirportDetailsContent } from './AirportDetailsContent';
import { AirportDetailsSheet } from './AirportDetailsSheet';
import { AirportDetailsPopover } from './AirportDetailsPopover';
import { MarkerTooltip } from '../MarkerTooltip';

type MarkerElementProps = HTMLAttributes<HTMLElement> & RefAttributes<HTMLElement>;

interface AirportDetailsProps {
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

export function AirportDetails({
    airport,
    children,
    details,
    isError,
    isLoading,
    open,
    tooltipContent,
    onOpenChange,
    onRetry,
}: AirportDetailsProps) {
    const isDesktop = useMediaQuery(MEDIA_QUERIES.desktop);
    useEffect(
        () => () => {
            onOpenChange(airport.icao, false);
        },
        [airport.icao, onOpenChange]
    );

    const content = (
        <AirportDetailsContent
            airport={airport}
            details={details}
            isError={isError}
            isLoading={isLoading}
            onClose={isDesktop ? () => onOpenChange(airport.icao, false) : undefined}
            onRetry={onRetry}
        />
    );

    if (isDesktop) {
        return (
            <AirportDetailsPopover
                content={content}
                open={open}
                tooltipContent={tooltipContent}
                onOpenChange={(nextOpen) => onOpenChange(airport.icao, nextOpen)}
            >
                {children}
            </AirportDetailsPopover>
        );
    }

    return (
        <>
            <MarkerTooltip content={tooltipContent} disabled={open}>
                {cloneElement(children, {
                    'aria-expanded': open,
                    'aria-haspopup': 'dialog',
                })}
            </MarkerTooltip>
            <AirportDetailsSheet
                content={content}
                open={open}
                onClose={() => onOpenChange(airport.icao, false)}
            />
        </>
    );
}
