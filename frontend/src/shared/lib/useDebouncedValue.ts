import { useEffect, useState } from 'react';

// TODO: удалить — единственный потребитель useDebouncedParams сам больше не используется
export function useDebouncedValue<T>(value: T, delayMs: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timeoutId = setTimeout(() => setDebouncedValue(value), delayMs);

        return () => clearTimeout(timeoutId);
    }, [value, delayMs]);

    return delayMs > 0 ? debouncedValue : value;
}
