import { useEffect, useState } from 'react';
import { formatUtcTime } from '@shared/lib/formatters';

/** Возвращает текущее время UTC и обновляет его каждую минуту. */
export function useUtcTime() {
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        let timeoutId: number;

        const scheduleNextUpdate = () => {
            const millisecondsUntilNextMinute = 60_000 - (Date.now() % 60_000);
            timeoutId = window.setTimeout(() => {
                setNow(new Date());
                scheduleNextUpdate();
            }, millisecondsUntilNextMinute);
        };

        scheduleNextUpdate();

        return () => window.clearTimeout(timeoutId);
    }, []);

    return {
        utcTime: formatUtcTime(now),
        utcDateTime: now.toISOString(),
    };
}
