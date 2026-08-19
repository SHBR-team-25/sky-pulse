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
    isLoading: boolean;
    open: boolean;
    tooltipContent: ReactNode;
    onOpenChange: (airportId: string, open: boolean) => void;
}

export function AirportDetails({
    airport,
    children,
    details,
    isLoading,
    open,
    tooltipContent,
    onOpenChange,
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
            isLoading={isLoading}
            onClose={isDesktop ? () => onOpenChange(airport.icao, false) : undefined}
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
