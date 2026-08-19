import { useCallback, useMemo } from 'react';
import { MapPin } from '@gravity-ui/icons';
import { Icon } from '@gravity-ui/uikit';
import type { Feature } from '@yandex/ymaps3-types/packages/clusterer';
import type { LngLat } from '@yandex/ymaps3-types';
import {
    clusterByGrid,
    YMapClusterer,
    YMapFeatureDataSource,
    YMapLayer,
    YMapMarker,
} from '@/shared/lib/ymaps3';

import { AirportDetailsPopover } from './AirportDetailsPopover';
import styles from './AirportsLayer.module.css';
import { useMockAirportFlights } from '../model/useMockAirportFlights';
import type { Airport } from '@/entities/airport';

const CLUSTER_SOURCE = 'clustered-airports';

/** Расстояние в пикселях, на котором маркеры начинают схлопываться. */
const CLUSTER_GRID_SIZE = 64;

interface AirportsClusterLayerProps {
    airports: Airport[];
}

export function AirportsClusterLayer({ airports }: AirportsClusterLayerProps) {
    const { selectedAirport, handleDetailsOpenChange } = useMockAirportFlights();
    const selectedAirportIcao = selectedAirport?.airportId;

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
                <YMapMarker coordinates={feature.geometry.coordinates} source={CLUSTER_SOURCE}>
                    <AirportDetailsPopover
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
                    </AirportDetailsPopover>
                </YMapMarker>
            );
        },
        [airportsByIcao, selectedAirport, selectedAirportIcao, handleDetailsOpenChange]
    );

    /** Схлопнутая группа аэропортов. */
    const renderCluster = useCallback((coordinates: LngLat, clusteredFeatures: Feature[]) => {
        const count = clusteredFeatures.length;

        return (
            <YMapMarker coordinates={coordinates} source={CLUSTER_SOURCE}>
                <div
                    className={styles.airportClusterMarker}
                    role="img"
                    tabIndex={0}
                    title={`Кластер: ${count} аэропортов`}
                    aria-label={`Кластер из ${count} аэропортов`}
                >
                    {count}
                </div>
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
}
