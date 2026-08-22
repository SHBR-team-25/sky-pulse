import type { ReactNode } from 'react';
import { Sheet } from '@gravity-ui/uikit';
import { MEDIA_QUERIES } from '@/shared/config';
import { useMediaQuery } from '@/shared/hooks';
import styles from './FlightDetails.module.css';

interface FlightDetailsSheetProps {
    content: ReactNode;
    open: boolean;
    onClose: () => void;
}

export function FlightDetailsSheet({ content, open, onClose }: FlightDetailsSheetProps) {
    const isCompactMobile = useMediaQuery(MEDIA_QUERIES.compactMobile);

    return (
        <Sheet
            id="flight-details-sheet"
            className={`${styles.sheet} ${styles.sheetMobile} ${
                isCompactMobile ? styles.sheetCompactMobile : ''
            }`}
            contentClassName={`${styles.sheetContent} ${styles.sheetContentBottom}`}
            swipeAreaClassName={styles.sheetSwipeArea}
            visible={open}
            onClose={onClose}
        >
            <div className={styles.sheetBody}>{content}</div>
        </Sheet>
    );
}
