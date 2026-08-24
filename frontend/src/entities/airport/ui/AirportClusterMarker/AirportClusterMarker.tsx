import { MapClusterMarker } from '@/shared/ui';

interface AirportClusterMarkerProps {
    count: number;
    decorative?: boolean;
    onClick?: () => void;
}

export function AirportClusterMarker({ count, decorative, onClick }: AirportClusterMarkerProps) {
    return (
        <MapClusterMarker
            count={count}
            decorative={decorative}
            label={`Кластер из ${count} аэропортов`}
            variant="warning"
            onClick={onClick}
        />
    );
}
