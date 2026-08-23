import { memo, useCallback, useMemo } from 'react';
import type { Feature } from '@yandex/ymaps3-types/packages/clusterer';
import type { LngLat } from '@yandex/ymaps3-types';
import {
    clusterByGrid,
    YMapClusterer,
    YMapFeatureDataSource,
    YMapLayer,
    YMapMarker,
} from '@/shared/lib/ymaps3';

import { AirportDetails } from './AirportDetails';
import styles from './AirportsLayer.module.css';
import { useSelectedAirportFlights } from '../model/useSelectedAirportFlights';
import { AirportClusterMarker, AirportMarker, type Airport } from '@/entities/airport';

const CLUSTER_SOURCE = 'clustered-airports';

/** Расстояние в пикселях, на котором маркеры начинают схлопываться. */
const CLUSTER_GRID_SIZE = 64;

interface AirportsClusterLayerProps {
    airports: Airport[];
}

export const AirportsClusterLayer = memo(function AirportsClusterLayer({
    airports,
}: AirportsClusterLayerProps) {
    const {
        selectedAirportIcao,
        details,
        isLoading,
        isError,
        handleDetailsOpenChange,
        handleRetry,
    } = useSelectedAirportFlights();

    const airportsByIcao = useMemo(
        () => new Map(airports.map((airport) => [airport.icao, airport])),
        [airports]
    );

    /** Аэропорты в формате GeoJSON-фич, которые понимает кластерер Яндекс.Карт. */
    const features = useMemo<Feature[]>(
        () =>
            airports.map((airport) => ({
                type: 'Feature',
                id: airport.icao,
                geometry: {
                    type: 'Point',
                    coordinates: [airport.position.lon, airport.position.lat],
                },
            })),
        [airports]
    );

    const clusterMethod = useMemo(() => clusterByGrid({ gridSize: CLUSTER_GRID_SIZE }), []);

    /** Фича, которую кластерер оставил одиночной - рисуем метку аэропорта */
    const renderAirport = useCallback(
        (feature: Feature) => {
            const airport = airportsByIcao.get(feature.id);

            if (!airport) {
                return null;
            }

            const isSelected = selectedAirportIcao === airport.icao;

            return (
                <YMapMarker coordinates={feature.geometry.coordinates} source={CLUSTER_SOURCE}>
                    <AirportDetails
                        airport={airport}
                        details={isSelected ? details : null}
                        isError={isSelected && isError}
                        isLoading={isSelected && isLoading}
                        open={isSelected}
                        tooltipContent={
                            <span className={styles.airportTooltipContent}>
                                <strong>{airport.iata ?? airport.icao}</strong>
                                <span>{airport.name}</span>
                            </span>
                        }
                        onOpenChange={handleDetailsOpenChange}
                        onRetry={handleRetry}
                    >
                        <AirportMarker
                            airport={airport}
                            isSelected={isSelected}
                            onClick={() => handleDetailsOpenChange(airport.icao, true)}
                        />
                    </AirportDetails>
                </YMapMarker>
            );
        },
        [
            airportsByIcao,
            selectedAirportIcao,
            details,
            isLoading,
            isError,
            handleDetailsOpenChange,
            handleRetry,
        ]
    );

    /** Схлопнутая группа аэропортов. */
    const renderCluster = useCallback((coordinates: LngLat, clusteredFeatures: Feature[]) => {
        return (
            <YMapMarker coordinates={coordinates} source={CLUSTER_SOURCE}>
                <AirportClusterMarker count={clusteredFeatures.length} />
            </YMapMarker>
        );
    }, []);

    return (
        <>
            <YMapFeatureDataSource id={CLUSTER_SOURCE} />
            <YMapLayer source={CLUSTER_SOURCE} type="markers" zIndex={1700} />

            {features.length > 0 && (
                <YMapClusterer
                    method={clusterMethod}
                    features={features}
                    marker={renderAirport}
                    cluster={renderCluster}
                    maxZoom={8}
                />
            )}
        </>
    );
});
