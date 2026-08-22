import {
    cloneElement,
    useEffect,
    type HTMLAttributes,
    type ReactElement,
    type ReactNode,
    type RefAttributes,
} from 'react';
import type { Flight } from '@/entities/flight';
import { MEDIA_QUERIES } from '@/shared/config';
import { useMediaQuery } from '@/shared/hooks';
import { FlightDetailsContent } from './FlightDetailsContent';
import { FlightDetailsSheet } from './FlightDetailsSheet';
import { FlightDetailsPopover } from './FlightDetailsPopover';
import { MarkerTooltip } from '../MarkerTooltip';

type MarkerElementProps = HTMLAttributes<HTMLElement> & RefAttributes<HTMLElement>;

interface FlightDetailsProps {
    children: ReactElement<MarkerElementProps>;
    flight: Flight | null;
    flightId: string;
    isLoading: boolean;
    open: boolean;
    tooltipContent: ReactNode;
    onOpenChange: (flightId: string, open: boolean) => void;
}

export function FlightDetails({
    children,
    flight,
    flightId,
    isLoading,
    open,
    tooltipContent,
    onOpenChange,
}: FlightDetailsProps) {
    const isDesktop = useMediaQuery(MEDIA_QUERIES.desktop);
    useEffect(
        () => () => {
            onOpenChange(flightId, false);
        },
        [flightId, onOpenChange]
    );

    const content = (
        <FlightDetailsContent
            flight={flight}
            isLoading={isLoading}
            onClose={isDesktop ? () => onOpenChange(flightId, false) : undefined}
        />
    );

    if (isDesktop) {
        return (
            <FlightDetailsPopover
                content={content}
                open={open}
                tooltipContent={tooltipContent}
                onOpenChange={(nextOpen) => onOpenChange(flightId, nextOpen)}
            >
                {children}
            </FlightDetailsPopover>
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
            <FlightDetailsSheet
                content={content}
                open={open}
                onClose={() => onOpenChange(flightId, false)}
            />
        </>
    );
}
