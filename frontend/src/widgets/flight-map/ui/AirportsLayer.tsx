import { MapPin } from '@gravity-ui/icons';
import { Icon } from '@gravity-ui/uikit';
import type { Airport } from '@/entities/airport';
import { YMapMarker } from '@/shared/lib/ymaps3';
import { useSelectedAirportFlights } from '../model/useSelectedAirportFlights';
import { AirportDetailsPopover } from './AirportDetailsPopover';
import styles from './AirportsLayer.module.css';

interface AirportsLayerProps {
    airports: Airport[];
}

export function AirportsLayer({ airports }: AirportsLayerProps) {
    const {
        selectedAirportIcao,
        details,
        isLoading,
        isError,
        handleDetailsOpenChange,
        handleRetry,
    } = useSelectedAirportFlights();

    return airports.map((airport) => {
        const code = airport.iata ?? airport.icao;
        const isSelected = selectedAirportIcao === airport.icao;
        const marker = (
            <button
                className={`${styles.airportMarker} ${isSelected ? styles.airportMarkerSelected : ''}`}
                type="button"
                aria-label={`Аэропорт ${airport.name}, ${code}`}
                aria-pressed={isSelected}
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
                <AirportDetailsPopover
                    airport={airport}
                    details={isSelected ? details : null}
                    isError={isSelected && isError}
                    isLoading={isSelected && isLoading}
                    open={isSelected}
                    tooltipContent={
                        <span className={styles.airportTooltipContent}>
                            <strong>{code}</strong>
                            <span>{airport.name}</span>
                        </span>
                    }
                    onOpenChange={handleDetailsOpenChange}
                    onRetry={handleRetry}
                >
                    {marker}
                </AirportDetailsPopover>
            </YMapMarker>
        );
    });
}
