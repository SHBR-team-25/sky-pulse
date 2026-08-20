import { memo, useCallback, useMemo } from 'react';
import { PlaneFill } from '@gravity-ui/icons';
import { Icon } from '@gravity-ui/uikit';
import type { Feature } from '@yandex/ymaps3-types/packages/clusterer';
import type { DrawingStyle, LngLat } from '@yandex/ymaps3-types';
import {
    clusterByGrid,
    YMapClusterer,
    YMapFeature,
    YMapFeatureDataSource,
    YMapLayer,
    YMapMarker,
} from '@/shared/lib/ymaps3';

import { FlightDetailsPopover } from './FlightDetailsPopover';
import styles from './FlightsLayer.module.css';
import { getFlightIconRotation } from '../model/flightIconRotation';
import { useFlightDetails } from '../model/useFlightDetails';
import type { Flight } from '@/entities/flight';

const CLUSTER_SOURCE = 'clustered-flights';

/** Расстояние в пикселях, на котором маркеры начинают схлопываться. */
const CLUSTER_GRID_SIZE = 64;

const FLIGHT_PATH_STYLE: DrawingStyle = {
    zIndex: 100,
    stroke: [{ color: 'var(--sky-color-status-warning)', width: 4 }],
};

interface FlightsClusterLayerProps {
    flights: Flight[];
}

export const FlightsClusterLayer = memo(function FlightsClusterLayer({
    flights,
}: FlightsClusterLayerProps) {
    const { selectedFlight, handleDetailsOpenChange } = useFlightDetails();

    const flightsById = useMemo(
        () => new Map(flights.map((flight) => [flight.icao24, flight])),
        [flights]
    );

    /** Борта в формате GeoJSON-фич, которые понимает кластерер Яндекс.Карт. */
    const features = useMemo<Feature[]>(
        () =>
            flights.map((flight) => ({
                type: 'Feature',
                id: flight.icao24,
                geometry: { type: 'Point', coordinates: [flight.lon, flight.lat] },
            })),
        [flights]
    );

    const clusterMethod = useMemo(() => clusterByGrid({ gridSize: CLUSTER_GRID_SIZE }), []);

    const selectedPathCoordinates = useMemo<LngLat[] | null>(() => {
        const track = selectedFlight?.track;

        if (!track || track.length < 2) {
            return null;
        }

        return track.map(({ lon, lat }) => [lon, lat]);
    }, [selectedFlight?.track]);

    /** Одиночный самолетик. */
    const renderFlight = useCallback(
        (feature: Feature) => {
            const flightId = feature.id;
            const flight = flightsById.get(flightId);
            const isSelected = selectedFlight?.flightId === flightId;
            const marker = (
                <div
                    className={styles.flightMarker}
                    role="img"
                    tabIndex={0}
                    aria-label={`Рейс ${flight?.callsign ?? flightId}`}
                >
                    <span
                        className={styles.flightMarkerIcon}
                        style={{ transform: getFlightIconRotation(flight?.trueTrack) }}
                        aria-hidden="true"
                    >
                        <Icon data={PlaneFill} size={14} />
                    </span>
                </div>
            );

            return (
                <YMapMarker coordinates={feature.geometry.coordinates} source={CLUSTER_SOURCE}>
                    <FlightDetailsPopover
                        flight={isSelected ? selectedFlight.flight : null}
                        flightId={flightId}
                        isLoading={isSelected && selectedFlight.isLoading}
                        open={isSelected}
                        tooltipContent={flight?.callsign ?? flightId}
                        onOpenChange={handleDetailsOpenChange}
                    >
                        {marker}
                    </FlightDetailsPopover>
                </YMapMarker>
            );
        },
        [flightsById, selectedFlight, handleDetailsOpenChange]
    );

    /** Схлопнутая группа бортов. */
    const renderCluster = useCallback((coordinates: LngLat, clusteredFeatures: Feature[]) => {
        const count = clusteredFeatures.length;

        return (
            <YMapMarker coordinates={coordinates} source={CLUSTER_SOURCE}>
                <div
                    className={styles.clusterMarker}
                    role="img"
                    tabIndex={0}
                    title={`Кластер: ${count} самолётов`}
                    aria-label={`Кластер из ${count} самолётов`}
                >
                    {count}
                </div>
            </YMapMarker>
        );
    }, []);

    return (
        <>
            {selectedPathCoordinates && (
                <YMapFeature
                    geometry={{ type: 'LineString', coordinates: selectedPathCoordinates }}
                    style={FLIGHT_PATH_STYLE}
                />
            )}

            <YMapFeatureDataSource id={CLUSTER_SOURCE} />
            <YMapLayer source={CLUSTER_SOURCE} type="markers" zIndex={1800} />

            {features.length > 0 && (
                <YMapClusterer
                    method={clusterMethod}
                    features={features}
                    marker={renderFlight}
                    cluster={renderCluster}
                    maxZoom={8}
                />
            )}
        </>
    );
});
