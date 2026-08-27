import { useCallback, useState } from 'react';
import { useAirportsFlights } from '@features/getAirportsFlights';

export function useSelectedAirportFlights() {
    const [selectedAirportIcao, setSelectedAirportIcao] = useState<string | null>(null);

    const handleDetailsOpenChange = useCallback((airportId: string, open: boolean) => {
        setSelectedAirportIcao((currentIcao) => {
            if (open) {
                return airportId;
            }

            return currentIcao === airportId ? null : currentIcao;
        });
    }, []);

    const { data, isLoading, isError, refetch } = useAirportsFlights(
        selectedAirportIcao ?? undefined
    );

    const handleRetry = useCallback(() => {
        void refetch();
    }, [refetch]);

    return {
        selectedAirportIcao,
        details: data ?? null,
        isLoading,
        isError,
        handleDetailsOpenChange,
        handleRetry,
    };
}
