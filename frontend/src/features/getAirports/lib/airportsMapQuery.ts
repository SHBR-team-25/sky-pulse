import type { MapRectParams } from '@shared/contexts/map-view';
import type { AirportsQuery } from '../model/types';

/**
 * Сколько аэропортов тянем в картовом режиме `/airports`. Справочник OurAirports
 * отдаёт около 48 тысяч записей, рисовать их все на карте нечем.
 */
export const AIRPORTS_MAP_LIMIT = 200;

/**
 * Собирает query для карты. Единственная точка сборки: роутер префетчит по тому же
 * ключу, что запрашивает страница, иначе префетч уходит мимо кэша.
 */
export function toAirportsMapQuery({
    lonMin,
    latMin,
    lonMax,
    latMax,
}: MapRectParams): AirportsQuery {
    return { lonMin, latMin, lonMax, latMax, limit: AIRPORTS_MAP_LIMIT };
}
