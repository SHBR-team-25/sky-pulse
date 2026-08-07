import styles from './MapPage.module.css';
import type { YMapLocationRequest } from '@yandex/ymaps3-types';
import {
    YMap,
    YMapDefaultSchemeLayer,
    YMapDefaultFeaturesLayer,
    reactify,
} from '@/shared/lib/ymaps3';

const WORLD_LOCATION: YMapLocationRequest = {
    center: [0, 0],
    zoom: 1,
};

interface MapPageProps {
    theme?: 'light' | 'dark';
}

export function MapPage({ theme = 'light' }: MapPageProps) {
    return (
        <main className={styles.map} aria-label="Карта полётов">
            <YMap theme={theme} location={reactify.useDefault(WORLD_LOCATION)}>
                <YMapDefaultSchemeLayer />
                <YMapDefaultFeaturesLayer />
            </YMap>
        </main>
    );
}
