import type { ReactElement, ReactNode } from 'react';
import { Tooltip } from '@gravity-ui/uikit';
import styles from './MarkerTooltip.module.css';

interface MarkerTooltipProps {
    children: ReactElement;
    content: ReactNode;
    disabled?: boolean;
}

export function MarkerTooltip({ children, content, disabled }: MarkerTooltipProps) {
    return (
        <Tooltip
            className={styles.markerTooltip}
            content={content}
            disabled={disabled}
            openDelay={50}
            placement="top"
        >
            {children}
        </Tooltip>
    );
}
