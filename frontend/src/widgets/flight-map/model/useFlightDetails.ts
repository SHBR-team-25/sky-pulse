import { useCallback, useMemo, useState } from 'react';
import type { Flight, TrackPoint } from '@/entities/flight';
import { useTargetFlight } from '@/features/getTargetFlight';

const EMPTY_TRACK: TrackPoint[] = [];

interface SelectedFlight {
    flightId: string;
    flight: Flight | null;
    isLoading: boolean;
}

export function useFlightDetails() {
    const [activeFlightId, setActiveFlightId] = useState<string | null>(null); // id рейса чью траекторию показываем
    const [openFlightId, setOpenFlightId] = useState<string | null>(null); // id рейса чьи данные для поповера показываем

    const { data, isPending, isPlaceholderData } = useTargetFlight(activeFlightId ?? undefined);

    const handleDetailsOpenChange = useCallback((flightId: string, open: boolean) => {
        if (open) {
            setActiveFlightId(flightId);
            setOpenFlightId(flightId);
            return;
        }

        setOpenFlightId((currentId) => {
            return currentId === flightId ? null : currentId;
        });
    }, []);

    const clearSelection = useCallback(() => {
        setActiveFlightId(null);
        setOpenFlightId(null);
    }, []);

    const renderedTrack = useMemo(
        () => (activeFlightId ? (data?.track ?? EMPTY_TRACK) : EMPTY_TRACK),
        [activeFlightId, data]
    );

    const selectedFlight = useMemo<SelectedFlight | null>(
        () =>
            openFlightId
                ? {
                      flightId: openFlightId,
                      flight: isPlaceholderData ? null : (data?.flight ?? null),
                      isLoading: isPending || isPlaceholderData,
                  }
                : null,
        [openFlightId, data, isPending, isPlaceholderData]
    );

    return {
        selectedFlight,
        renderedTrack,
        handleDetailsOpenChange,
        clearSelection,
    };
}
