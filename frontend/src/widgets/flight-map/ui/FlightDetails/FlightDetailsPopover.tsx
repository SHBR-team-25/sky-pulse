import {
    cloneElement,
    type HTMLAttributes,
    type ReactElement,
    type ReactNode,
    type RefAttributes,
} from 'react';
import { Popover } from '@gravity-ui/uikit';
import { MarkerTooltip } from '../MarkerTooltip';
import styles from './FlightDetails.module.css';

type MarkerElementProps = HTMLAttributes<HTMLElement> & RefAttributes<HTMLElement>;

interface FlightDetailsPopoverProps {
    children: ReactElement<MarkerElementProps>;
    content: ReactNode;
    open: boolean;
    tooltipContent: ReactNode;
    onOpenChange: (open: boolean) => void;
}

export function FlightDetailsPopover({
    children,
    content,
    open,
    tooltipContent,
    onOpenChange,
}: FlightDetailsPopoverProps) {
    return (
        <Popover
            className={styles.popover}
            content={content}
            open={open}
            onOpenChange={onOpenChange}
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
