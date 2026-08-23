import { MapClusterMarker } from '@/shared/ui';

interface AirportClusterMarkerProps {
    count: number;
    decorative?: boolean;
}

export function AirportClusterMarker({ count, decorative }: AirportClusterMarkerProps) {
    return (
        <MapClusterMarker
            count={count}
            decorative={decorative}
            label={`Кластер из ${count} аэропортов`}
            variant="warning"
        />
    );
}
