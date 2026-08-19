import {
    cloneElement,
    useCallback,
    useEffect,
    type KeyboardEvent,
    type MouseEvent,
    type HTMLAttributes,
    type ReactElement,
    type ReactNode,
    type RefAttributes,
} from 'react';
import { Xmark } from '@gravity-ui/icons';
import { Button, Drawer, Icon, Spin } from '@gravity-ui/uikit';
import type { Airport } from '@/entities/airport';
import type { AirportFlightsResponse } from '@/features/getAirportsFlights';
import { useMediaQuery } from '@/shared/hooks';
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
    const isMobile = useMediaQuery('(max-width: 640px)');
    const drawerPlacement = isMobile ? 'bottom' : 'left';
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
    } else if (details) {
        content = <AirportDetailsCard airport={airport} details={details} />;
    } else {
        content = (
            <div className={styles.message} role="alert">
                No details found
            </div>
        );
    }

    const handleMarkerClick = useCallback(
        (event: MouseEvent<HTMLElement>) => {
            children.props.onClick?.(event);
            handleOpenChange(true);
        },
        [children.props, handleOpenChange]
    );

    const handleMarkerKeyDown = useCallback(
        (event: KeyboardEvent<HTMLElement>) => {
            children.props.onKeyDown?.(event);

            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleOpenChange(true);
            }
        },
        [children.props, handleOpenChange]
    );

    return (
        <>
            <MarkerTooltip content={tooltipContent} disabled={open}>
                {cloneElement(children, {
                    'aria-expanded': open,
                    'aria-haspopup': 'dialog',
                    onClick: handleMarkerClick,
                    onKeyDown: handleMarkerKeyDown,
                })}
            </MarkerTooltip>
            <Drawer
                className={styles.drawer}
                contentClassName={`${styles.drawerContent} ${
                    isMobile ? styles.drawerContentBottom : styles.drawerContentSide
                }`}
                open={open}
                onOpenChange={handleOpenChange}
                placement={drawerPlacement}
                resizable
                minSize={280}
                maxSize={800}
                contentOverflow="auto"
                aria-label="Airport details"
            >
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
            </Drawer>
        </>
    );
}
