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
import { Button, Drawer, Icon, Popover, Spin } from '@gravity-ui/uikit';
import { FlightDetailsCard } from './FlightDetailsCard';
import styles from './FlightDetailsPopover.module.css';
import { MarkerTooltip } from './MarkerTooltip';
import type { FlightDetailsResponse } from '@/features/getTargetFlight';
import { useMediaQuery } from '@/shared/hooks';

type MarkerElementProps = HTMLAttributes<HTMLElement> & RefAttributes<HTMLElement>;

interface FlightDetailsPopoverProps {
    children: ReactElement<MarkerElementProps>;
    details: FlightDetailsResponse | null;
    flightId: string;
    isLoading: boolean;
    open: boolean;
    tooltipContent: ReactNode;
    onOpenChange: (flightId: string, open: boolean) => void;
}

export function FlightDetailsPopover({
    children,
    details,
    flightId,
    isLoading,
    open,
    tooltipContent,
    onOpenChange,
}: FlightDetailsPopoverProps) {
    const isDesktop = useMediaQuery('(min-width: 1025px)');
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

    if (isDesktop) {
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
                            <div className={styles.loading} role="status" aria-live="polite">
                                <Spin size="l" />
                                <span>Загружаем данные о рейсе</span>
                            </div>
                        ) : (
                            details && <FlightDetailsCard details={details} />
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
                contentClassName={styles.drawerContent}
                open={open}
                onOpenChange={handleOpenChange}
                placement="bottom"
                resizable
                minSize={280}
                maxSize={800}
                contentOverflow="auto"
                aria-label="Flight details"
            >
                <div className={`${styles.content} ${styles.drawerBody}`}>
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
                    ) : details ? (
                        <FlightDetailsCard details={details} />
                    ) : (
                        <div className={styles.message} role="alert">
                            No details found
                        </div>
                    )}
                </div>
            </Drawer>
        </>
    );
}
