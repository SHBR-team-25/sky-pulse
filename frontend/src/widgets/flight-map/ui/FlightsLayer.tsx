import { useCallback, useMemo } from 'react';
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
import { useMockFlightDetails } from '../model/useMockFlightDetails';
import type { LiveFlight } from '@/entities/flight';

const CLUSTER_SOURCE = 'clustered-flights';
const FLIGHT_PATH_STYLE: DrawingStyle = {
    zIndex: 100,
    stroke: [{ color: 'var(--sky-color-status-warning)', width: 4 }],
};

interface FlightsLayerProps {
    flights: LiveFlight[];
}

export function FlightsLayer({ flights }: FlightsLayerProps) {
    const { selectedFlight, handleDetailsOpenChange } = useMockFlightDetails();

    const selectedPathCoordinates = useMemo<LngLat[] | null>(() => {
        const path = selectedFlight?.details?.path;

        if (!path || path.length < 2) {
            return null;
        }

        return path.map(({ lon, lat }) => [lon, lat]);
    }, [selectedFlight?.details]);

    const soloFlights = useMemo(
        () => flights.filter((flight) => flight.type === 'solo'),
        [flights]
    );

    /**
     * Фильтрует массив, оставляя серверные кластеры (multie),
     * и преобразует их в структуру Map (словарь вида [icao24, flight]) для мгновенного поиска по ID.
     */
    const clusteredFlightsById = useMemo(
        () =>
            new Map(
                flights
                    .filter((flight) => flight.type === 'multie')
                    .map((flight) => [flight.icao24, flight])
            ),
        [flights]
    );

    /**
     * Преобразует данные серверных кластеров в понятный для Яндекс.Карт формат GeoJSON-стандарта (Feature[]).
     * Каждая фича получает уникальный id (это icao24), тип Point и свои географические координаты.
     */
    const clusterFeatures = useMemo<Feature[]>(
        () =>
            Array.from(clusteredFlightsById.values(), (flight) => ({
                type: 'Feature',
                id: flight.icao24,
                geometry: {
                    type: 'Point',
                    coordinates: [flight.position.lon, flight.position.lat],
                },
            })),
        [clusteredFlightsById]
    );

    /**
     * Инициализирует функцию clusterByGrid с размером сетки в 64 пикселя. Она определяет,
     * на каком расстоянии маркеры начнут схлопываться вместе.
     *
     *
     * Пригодится, если захотим дополнительно сделать "схлопывание" кластеров на стороне фронта
     */
    const clusterMethod = useMemo(() => clusterByGrid({ gridSize: 64 }), []);

    const renderClusteredFlight = useCallback(
        (feature: Feature) => {
            const flight = clusteredFlightsById.get(feature.id);
            const count = flight?.count ?? 1;

            return (
                <YMapMarker coordinates={feature.geometry.coordinates} source={CLUSTER_SOURCE}>
                    <div
                        className={styles.clusterMarker}
                        role="img"
                        aria-label={`Кластер из ${count} самолётов`}
                        title={`Кластер: ${count} самолётов`}
                    >
                        {count}
                    </div>
                </YMapMarker>
            );
        },
        [clusteredFlightsById]
    );

    /**
     * Отрисовывает одиночный серверный кластер (когда на карте отображается один элемент multie, не объединённый с другими)
     *
     * Пригодится, если захотим дополнительно сделать "схлопывание" кластеров на стороне фронта
     */
    const renderCombinedCluster = useCallback((coordinates: LngLat, features: Feature[]) => {
        // TODO: Enable this when backend flight clusters should be combined on the map.
        // const count = features.reduce(
        //     (total, feature) =>
        //         total + (clusteredFlightsById.get(feature.id)?.count ?? 1),
        //     0
        // );
        const count = features.length;

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

            {soloFlights.map((flight) => {
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
                                transform: `rotate(${(flight.position.headingDeg ?? 0) + 180}deg)`,
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
                        coordinates={[flight.position.lon, flight.position.lat]}
                        zIndex={200}
                    >
                        <FlightDetailsPopover
                            details={isSelected ? selectedFlight.details : null}
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

            {clusterFeatures.length > 0 && (
                <>
                    <YMapFeatureDataSource id={CLUSTER_SOURCE} />
                    <YMapLayer source={CLUSTER_SOURCE} type="markers" zIndex={1800} />
                    <YMapClusterer
                        method={clusterMethod}
                        features={clusterFeatures}
                        marker={renderClusteredFlight}
                        cluster={renderCombinedCluster}
                    />
                </>
            )}
        </>
    );
}
