import type { YMapLocationRequest } from '@yandex/ymaps3-types';
import {
    YMap,
    YMapControls,
    YMapDefaultFeaturesLayer,
    YMapDefaultSchemeLayer,
    YMapZoomControl,
    reactify,
} from '@/shared/lib/ymaps3';
import { AirportsLayer } from './AirportsLayer';
import { FlightsLayer } from './FlightsLayer';
import styles from './FlightMap.module.css';
import type { Airport } from '@/entities/airport';
import type { LiveFlight } from '@/entities/flight';

const FLIGHTS_LOCATION: YMapLocationRequest = {
    center: [34, 57.8],
    zoom: 5,
};

const ZOOM_RANGE = { min: 3, max: 15 };

interface FlightMapProps {
    airports: Airport[];
    flights: LiveFlight[];
    theme?: 'light' | 'dark';
}

export function FlightMap({ airports, flights, theme = 'light' }: FlightMapProps) {
    return (
        <div className={styles.map}>
            <YMap
                theme={theme}
                location={reactify.useDefault(FLIGHTS_LOCATION)}
                zoomRange={ZOOM_RANGE}
            >
                <YMapDefaultSchemeLayer />
                <YMapDefaultFeaturesLayer />
                <AirportsLayer airports={airports} />
                <FlightsLayer flights={flights} />

                <YMapControls position="right">
                    <YMapZoomControl />
                </YMapControls>
            </YMap>
        </div>
    );
}
