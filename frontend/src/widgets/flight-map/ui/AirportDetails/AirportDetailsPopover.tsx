import {
    cloneElement,
    type HTMLAttributes,
    type ReactElement,
    type ReactNode,
    type RefAttributes,
} from 'react';
import { Popover } from '@gravity-ui/uikit';
import { MarkerTooltip } from '../MarkerTooltip';
import styles from './AirportDetails.module.css';

type MarkerElementProps = HTMLAttributes<HTMLElement> & RefAttributes<HTMLElement>;

interface AirportDetailsPopoverProps {
    children: ReactElement<MarkerElementProps>;
    content: ReactNode;
    open: boolean;
    tooltipContent: ReactNode;
    onOpenChange: (open: boolean) => void;
}

export function AirportDetailsPopover({
    children,
    content,
    open,
    tooltipContent,
    onOpenChange,
}: AirportDetailsPopoverProps) {
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
