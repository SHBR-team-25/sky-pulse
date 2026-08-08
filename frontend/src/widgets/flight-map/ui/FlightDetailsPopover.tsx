import {
    cloneElement,
    useCallback,
    useRef,
    useState,
    type HTMLAttributes,
    type ReactElement,
    type ReactNode,
    type RefAttributes,
} from 'react';
import { Popover, Spin } from '@gravity-ui/uikit';
import { getFlightDetails } from '@/features/getFlightDetails';
import type { FlightDetails } from '../model/types';
import { FlightDetailsCard } from './FlightDetailsCard';
import styles from './FlightDetailsPopover.module.css';
import { MarkerTooltip } from './MarkerTooltip';

type MarkerElementProps = HTMLAttributes<HTMLElement> & RefAttributes<HTMLElement>;

interface FlightDetailsPopoverProps {
    children: ReactElement<MarkerElementProps>;
    flightId: string;
    tooltipContent: ReactNode;
}

export function FlightDetailsPopover({
    children,
    flightId,
    tooltipContent,
}: FlightDetailsPopoverProps) {
    const [details, setDetails] = useState<FlightDetails | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const requestIdRef = useRef(0);

    // FIXME: переделать под реальный запрос, убрать requestIdRef и лишние проверки
    const handleOpenChange = useCallback(
        async (nextOpen: boolean) => {
            if (!nextOpen) {
                requestIdRef.current += 1;
                setOpen(false);
                setIsLoading(false);
                return;
            }

            const requestId = requestIdRef.current + 1;
            requestIdRef.current = requestId;
            setDetails(null);
            setIsLoading(true);
            setOpen(true);

            try {
                const nextDetails = await getFlightDetails(flightId);

                if (requestId !== requestIdRef.current) {
                    return;
                }

                setDetails(nextDetails);
                setOpen(nextDetails !== null);
            } catch {
                if (requestId === requestIdRef.current) {
                    setDetails(null);
                    setOpen(false);
                }
            } finally {
                if (requestId === requestIdRef.current) {
                    setIsLoading(false);
                }
            }
        },
        [flightId]
    );

    return (
        <Popover
            className={styles.popover}
            content={
                isLoading ? (
                    <div className={styles.loading} role="status" aria-live="polite">
                        <Spin size="l" />
                        <span>Загружаем данные о рейсе</span>
                    </div>
                ) : (
                    details && <FlightDetailsCard details={details} />
                )
            }
            open={open}
            onOpenChange={handleOpenChange}
            trigger="click"
            placement="right"
            offset={14}
            hasArrow={false}
            zIndex={2147483647}
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
