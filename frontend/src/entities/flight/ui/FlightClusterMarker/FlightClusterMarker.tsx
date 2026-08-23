import { MapClusterMarker } from '@/shared/ui';

interface FlightClusterMarkerProps {
    count: number;
    decorative?: boolean;
}

export function FlightClusterMarker({ count, decorative }: FlightClusterMarkerProps) {
    return (
        <MapClusterMarker
            count={count}
            decorative={decorative}
            label={`Кластер из ${count} самолётов`}
            variant="accent"
        />
    );
}
