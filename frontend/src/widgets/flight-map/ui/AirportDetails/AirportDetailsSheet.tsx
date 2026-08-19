import type { ReactNode } from 'react';
import { Sheet } from '@gravity-ui/uikit';
import { MEDIA_QUERIES } from '@/shared/config';
import { useMediaQuery } from '@/shared/hooks';
import styles from './AirportDetails.module.css';

interface AirportDetailsSheetProps {
    content: ReactNode;
    open: boolean;
    onClose: () => void;
}

export function AirportDetailsSheet({ content, open, onClose }: AirportDetailsSheetProps) {
    const isMobile = useMediaQuery(MEDIA_QUERIES.mobile);
    const isCompactMobile = useMediaQuery(MEDIA_QUERIES.compactMobile);

    return (
        <Sheet
            id="airport-details-sheet"
            className={`${styles.sheet} ${isMobile ? styles.sheetMobile : ''} ${
                isCompactMobile ? styles.sheetCompactMobile : ''
            }`}
            contentClassName={`${styles.sheetContent} ${styles.sheetContentBottom}`}
            swipeAreaClassName={styles.sheetSwipeArea}
            visible={open}
            onClose={onClose}
        >
            {content}
        </Sheet>
    );
}
