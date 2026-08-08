import type { ReactElement, ReactNode } from 'react';
import { Tooltip } from '@gravity-ui/uikit';
import styles from './MarkerTooltip.module.css';

interface MarkerTooltipProps {
    children: ReactElement;
    content: ReactNode;
    variant?: 'default' | 'airport';
}

export function MarkerTooltip({ children, content, variant = 'default' }: MarkerTooltipProps) {
    const className =
        variant === 'airport'
            ? `${styles.markerTooltip} ${styles.airportTooltip}`
            : styles.markerTooltip;

    return (
        <Tooltip className={className} placement="top" openDelay={50} content={content}>
            {children}
        </Tooltip>
    );
}
