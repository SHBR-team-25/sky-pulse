import { createContext } from 'react';
import type { MapView } from './types';

export const MapViewContext = createContext<MapView | null>(null);
export const SetMapViewContext = createContext<((view: MapView) => void) | null>(null);
