import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';

const METRIKA_COUNTER_ID = 111856824;

type Metrika = (
    counterId: number,
    method: 'hit',
    url: string,
    options: {
        referer: string;
        title: string;
    }
) => void;

export function MetrikaPageTracker() {
    const { pathname } = useLocation();
    const previousUrl = useRef(document.referrer);
    const lastTrackedPath = useRef<string | null>(null);

    useEffect(() => {
        if (pathname === '/' || pathname === lastTrackedPath.current) {
            return;
        }

        const url = window.location.href;
        const ym = (window as Window & { ym?: Metrika }).ym;

        ym?.(METRIKA_COUNTER_ID, 'hit', url, {
            referer: previousUrl.current,
            title: document.title,
        });

        lastTrackedPath.current = pathname;
        previousUrl.current = url;
    }, [pathname]);

    return null;
}
