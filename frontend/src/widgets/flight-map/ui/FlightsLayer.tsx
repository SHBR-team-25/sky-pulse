import { useMemo } from 'react';
import { PlaneFill } from '@gravity-ui/icons';
import { Icon } from '@gravity-ui/uikit';
import type { DrawingStyle, LngLat } from '@yandex/ymaps3-types';
import { YMapFeature, YMapMarker } from '@/shared/lib/ymaps3';

import { FlightDetailsPopover } from './FlightDetailsPopover';
import styles from './FlightsLayer.module.css';
import { useFlightDetails } from '../model/useFlightDetails';
import type { Flight } from '@/entities/flight';

const FLIGHT_PATH_STYLE: DrawingStyle = {
    zIndex: 100,
    stroke: [{ color: 'var(--sky-color-status-warning)', width: 4 }],
};

interface FlightsLayerProps {
    flights: Flight[];
}

/**
 * Борта рисуются поштучно: от перегрузки карты спасает срез `MAX_RENDERED_FLIGHTS`
 * в `useLiveFlights`. Заготовка на замену срезу лежит в `FlightsClusterLayer`.
 */
export function FlightsLayer({ flights }: FlightsLayerProps) {
    const { selectedFlight, handleDetailsOpenChange } = useFlightDetails();

    const selectedPathCoordinates = useMemo<LngLat[] | null>(() => {
        const track = selectedFlight?.track;

        if (!track || track.length < 2) {
            return null;
        }

        return track.map(({ lon, lat }) => [lon, lat]);
    }, [selectedFlight?.track]);

    return (
        <>
            {selectedPathCoordinates && (
                <YMapFeature
                    geometry={{ type: 'LineString', coordinates: selectedPathCoordinates }}
                    style={FLIGHT_PATH_STYLE}
                />
            )}

            {flights.map((flight) => {
                const isSelected = selectedFlight?.flightId === flight.icao24;
                const marker = (
                    <div
                        className={styles.flightMarker}
                        role="img"
                        tabIndex={0} // чтобы можно было перемещаться через Tab
                        aria-label={`Рейс ${flight.callsign ?? flight.icao24}`}
                    >
                        <span
                            className={styles.flightMarkerIcon}
                            style={{
                                transform: `rotate(${(flight.trueTrack ?? 0) + 180}deg)`,
                            }}
                            aria-hidden="true"
                        >
                            <Icon data={PlaneFill} size={14} />
                        </span>
                    </div>
                );

                return (
                    <YMapMarker
                        key={flight.icao24}
                        coordinates={[flight.lon, flight.lat]}
                        zIndex={200}
                    >
                        <FlightDetailsPopover
                            flight={isSelected ? selectedFlight.flight : null}
                            flightId={flight.icao24}
                            isLoading={isSelected && selectedFlight.isLoading}
                            open={isSelected}
                            tooltipContent={flight.callsign ?? flight.icao24}
                            onOpenChange={handleDetailsOpenChange}
                        >
                            {marker}
                        </FlightDetailsPopover>
                    </YMapMarker>
                );
            })}
        </>
    );
}
