import { MapClusterMarker } from '@/shared/ui';

interface FlightClusterMarkerProps {
    count: number;
    decorative?: boolean;
    onClick?: () => void;
}

export function FlightClusterMarker({ count, decorative, onClick }: FlightClusterMarkerProps) {
    return (
        <MapClusterMarker
            count={count}
            decorative={decorative}
            label={`Кластер из ${count} самолётов`}
            variant="accent"
            onClick={onClick}
        />
    );
}
