import type { LngLat } from '@yandex/ymaps3-types';

export const CLUSTER_MAX_ZOOM = 8;

const CLUSTER_ZOOM_STEP = 2;

export const CLUSTER_ZOOM_DURATION_MS = 400;

export function getClusterZoom(currentZoom: number): number {
    return Math.min(Math.floor(currentZoom) + CLUSTER_ZOOM_STEP, CLUSTER_MAX_ZOOM + 0.1);
}

export type ClusterClickHandler = (coordinates: LngLat) => void;
