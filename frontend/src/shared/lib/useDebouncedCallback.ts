import { useCallback, useEffect, useRef } from 'react';

export function useDebouncedCallback<TArgs extends unknown[]>(
    callback: (...args: TArgs) => void,
    delayMs: number
): (...args: TArgs) => void {
    const callbackRef = useRef(callback);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        callbackRef.current = callback;
    });

    useEffect(
        () => () => {
            if (timeoutRef.current !== null) {
                clearTimeout(timeoutRef.current);
            }
        },
        []
    );

    return useCallback(
        (...args: TArgs) => {
            if (timeoutRef.current !== null) {
                clearTimeout(timeoutRef.current);
            }

            timeoutRef.current = setTimeout(() => {
                timeoutRef.current = null;
                callbackRef.current(...args);
            }, delayMs);
        },
        [delayMs]
    );
}
