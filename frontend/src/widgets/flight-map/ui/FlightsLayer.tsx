import { useCallback, useMemo } from 'react';
import { PlaneFill } from '@gravity-ui/icons';
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
import type { Flight } from '../model/types';
import { FlightDetailsPopover } from './FlightDetailsPopover';
import styles from './FlightsLayer.module.css';

const CLUSTER_SOURCE = 'clustered-flights';

interface FlightsLayerProps {
    flights: Flight[];
}

export function FlightsLayer({ flights }: FlightsLayerProps) {
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
            {soloFlights.map((flight) => {
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
                                transform: `rotate(${flight.position.headingDeg ?? 0}deg)`,
                            }}
                            aria-hidden="true"
                        >
                            <Icon data={PlaneFill} size={20} />
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
                            flightId={flight.icao24}
                            tooltipContent={flight.callsign ?? flight.icao24}
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
