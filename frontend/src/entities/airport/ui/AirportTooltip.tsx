import { Tooltip, type TooltipProps } from '@gravity-ui/uikit';
import styles from './AirportTooltip.module.css';

type AirportTooltipProps = Pick<TooltipProps, 'children' | 'content' | 'disablePortal'>;

export function AirportTooltip({ children, content, disablePortal }: AirportTooltipProps) {
    return (
        <Tooltip
            className={styles.tooltip}
            content={content}
            disablePortal={disablePortal}
            openDelay={50}
            placement="top"
        >
            {children}
        </Tooltip>
    );
}
