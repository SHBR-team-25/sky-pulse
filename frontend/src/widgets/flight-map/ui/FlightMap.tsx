import type { YMapLocationRequest } from '@yandex/ymaps3-types';
import {
    YMap,
    YMapDefaultFeaturesLayer,
    YMapDefaultSchemeLayer,
    reactify,
} from '@/shared/lib/ymaps3';
import type { Airport, Flight } from '../model/types';
import { AirportsLayer } from './AirportsLayer';
import { FlightsLayer } from './FlightsLayer';
import styles from './FlightMap.module.css';

const FLIGHTS_LOCATION: YMapLocationRequest = {
    center: [34, 57.8],
    zoom: 5,
};

interface FlightMapProps {
    airports: Airport[];
    flights: Flight[];
    theme?: 'light' | 'dark';
}

export function FlightMap({ airports, flights, theme = 'light' }: FlightMapProps) {
    return (
        <div className={styles.map}>
            <YMap theme={theme} location={reactify.useDefault(FLIGHTS_LOCATION)}>
                <YMapDefaultSchemeLayer />
                <YMapDefaultFeaturesLayer />
                <AirportsLayer airports={airports} />
                <FlightsLayer flights={flights} />
            </YMap>
        </div>
    );
}
