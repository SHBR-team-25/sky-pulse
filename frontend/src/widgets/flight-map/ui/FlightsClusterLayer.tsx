import { memo, useCallback, useMemo } from 'react';
import type { Feature } from '@yandex/ymaps3-types/packages/clusterer';
import type { DrawingStyle, LngLat } from '@yandex/ymaps3-types';
import {
    clusterByGrid,
    YMapClusterer,
    YMapFeature,
    YMapFeatureDataSource,
    YMapControl,
    YMapControls,
    YMapLayer,
    YMapMarker,
} from '@/shared/lib/ymaps3';

import { FlightDetails } from './FlightDetails';
import { useFlightDetails } from '../model/useFlightDetails';
import { FlightClusterMarker, FlightMarker, type Flight } from '@/entities/flight';
import { Button, Icon } from '@gravity-ui/uikit';
import { Xmark } from '@gravity-ui/icons';
import styles from './FlightsClusterLayer.module.css';

const CLUSTER_SOURCE = 'clustered-flights';

/** Расстояние в пикселях, на котором маркеры начинают схлопываться. */
const CLUSTER_GRID_SIZE = 64;

const FLIGHT_PATH_STYLE: DrawingStyle = {
    zIndex: 100,
    stroke: [{ color: 'var(--sky-color-map-flight-path)', width: 4 }],
};

interface FlightsClusterLayerProps {
    flights: Flight[];
}

export const FlightsClusterLayer = memo(function FlightsClusterLayer({
    flights,
}: FlightsClusterLayerProps) {
    const { selectedFlight, renderedTrack, handleDetailsOpenChange, clearSelection } =
        useFlightDetails();

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
        if (renderedTrack.length < 2) {
            return null;
        }

        return renderedTrack.map(({ lon, lat }) => [lon, lat]);
    }, [renderedTrack]);

    /** Одиночный самолетик. */
    const renderFlight = useCallback(
        (feature: Feature) => {
            const flightId = feature.id;
            const flight = flightsById.get(flightId);
            const isSelected = selectedFlight?.flightId === flightId;

            return (
                <YMapMarker coordinates={feature.geometry.coordinates} source={CLUSTER_SOURCE}>
                    <FlightDetails
                        flight={isSelected ? selectedFlight.flight : null}
                        flightId={flightId}
                        isLoading={isSelected && selectedFlight.isLoading}
                        open={isSelected}
                        tooltipContent={flight?.callsign ?? flightId}
                        onOpenChange={handleDetailsOpenChange}
                    >
                        <FlightMarker
                            flight={flight}
                            flightId={flightId}
                            isSelected={isSelected}
                            onClick={() => handleDetailsOpenChange(flightId, true)}
                        />
                    </FlightDetails>
                </YMapMarker>
            );
        },
        [flightsById, selectedFlight, handleDetailsOpenChange]
    );

    /** Схлопнутая группа бортов. */
    const renderCluster = useCallback((coordinates: LngLat, clusteredFeatures: Feature[]) => {
        return (
            <YMapMarker coordinates={coordinates} source={CLUSTER_SOURCE}>
                <FlightClusterMarker count={clusteredFeatures.length} />
            </YMapMarker>
        );
    }, []);

    return (
        <>
            {selectedPathCoordinates && (
                <>
                    <YMapControls position="top left">
                        <YMapControl transparent>
                            <Button
                                view="outlined"
                                onClick={clearSelection}
                                className={styles.hidePathButton}
                            >
                                Скрыть путь самолёта
                                <Button.Icon>
                                    <Icon data={Xmark} size={16} />
                                </Button.Icon>
                            </Button>
                        </YMapControl>
                    </YMapControls>

                    <YMapFeature
                        geometry={{ type: 'LineString', coordinates: selectedPathCoordinates }}
                        style={FLIGHT_PATH_STYLE}
                    />
                </>
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
