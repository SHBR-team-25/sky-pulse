import { useMemo } from 'react';
import { useDebouncedValue } from '@shared/lib/useDebouncedValue';

const DEFAULT_DEBOUNCE_MS = 300;

function serializeParams(params: object): string {
    const entries = Object.entries(params)
        .filter(([, value]) => value !== undefined)
        .sort(([left], [right]) => left.localeCompare(right));

    return JSON.stringify(entries);
}

// TODO: удалить — после отказа от debounceMs в useLiveFlights/useAirports хук нигде не используется
export function useDebouncedParams<T extends object>(
    params: T,
    delayMs: number = DEFAULT_DEBOUNCE_MS
): T {
    const debouncedKey = useDebouncedValue(serializeParams(params), delayMs);

    const debouncedParams = useMemo(
        () => Object.fromEntries(JSON.parse(debouncedKey) as [string, unknown][]) as T,
        [debouncedKey]
    );

    return delayMs > 0 ? debouncedParams : params;
}
