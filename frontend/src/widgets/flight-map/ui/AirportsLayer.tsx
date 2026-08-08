import { MapPin } from '@gravity-ui/icons';
import { Icon } from '@gravity-ui/uikit';
import { AirportTooltip } from '@/entities/airport';
import { YMapMarker } from '@/shared/lib/ymaps3';
import type { Airport } from '../model/types';
import styles from './AirportsLayer.module.css';

interface AirportsLayerProps {
    airports: Airport[];
}

export function AirportsLayer({ airports }: AirportsLayerProps) {
    return airports.map((airport) => {
        const code = airport.iata ?? airport.icao;

        return (
            <YMapMarker
                key={airport.icao}
                coordinates={[airport.position.lon, airport.position.lat]}
                zIndex={100}
            >
                <AirportTooltip
                    content={
                        <span className={styles.airportTooltipContent}>
                            <strong>{code}</strong>
                            <span>{airport.name}</span>
                        </span>
                    }
                >
                    <div
                        className={styles.airportMarker}
                        role="img"
                        tabIndex={0}
                        aria-label={`Аэропорт ${airport.name}, ${code}`}
                    >
                        <span className={styles.airportMarkerIcon} aria-hidden="true">
                            <Icon data={MapPin} size={18} />
                        </span>
                    </div>
                </AirportTooltip>
            </YMapMarker>
        );
    });
}
