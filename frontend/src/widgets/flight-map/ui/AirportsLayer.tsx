import { MapPin } from '@gravity-ui/icons';
import { Icon } from '@gravity-ui/uikit';
import type { Airport } from '@/entities/airport';
import { YMapMarker } from '@/shared/lib/ymaps3';
import { useMockAirportFlights } from '../model/useMockAirportFlights';
import { AirportDetails } from './AirportDetails';
import styles from './AirportsLayer.module.css';

interface AirportsLayerProps {
    airports: Airport[];
}

export function AirportsLayer({ airports }: AirportsLayerProps) {
    const { selectedAirport, handleDetailsOpenChange } = useMockAirportFlights();
    const selectedAirportIcao = selectedAirport?.airportId;

    return airports.map((airport) => {
        const code = airport.iata ?? airport.icao;
        const isSelected = selectedAirportIcao === airport.icao;
        const marker = (
            <button
                className={`${styles.airportMarker} ${isSelected ? styles.airportMarkerSelected : ''}`}
                type="button"
                aria-label={`Аэропорт ${airport.name}, ${code}`}
                aria-pressed={isSelected}
                onClick={() => handleDetailsOpenChange(airport.icao, true)}
            >
                <span className={styles.airportMarkerIcon} aria-hidden="true">
                    <Icon data={MapPin} size={12} />
                </span>
            </button>
        );

        return (
            <YMapMarker
                key={airport.icao}
                coordinates={[airport.position.lon, airport.position.lat]}
                zIndex={100}
            >
                <AirportDetails
                    airport={airport}
                    details={isSelected ? (selectedAirport?.details ?? null) : null}
                    isLoading={isSelected && !!selectedAirport?.isLoading}
                    open={isSelected}
                    tooltipContent={
                        <span className={styles.airportTooltipContent}>
                            <strong>{code}</strong>
                            <span>{airport.name}</span>
                        </span>
                    }
                    onOpenChange={handleDetailsOpenChange}
                >
                    {marker}
                </AirportDetails>
            </YMapMarker>
        );
    });
}
