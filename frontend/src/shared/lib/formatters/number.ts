/** Форматтер чисел для русской локали. */
export const numberFormatter = new Intl.NumberFormat('ru-RU');

/** Форматирует географическую координату с направлением.
 * Пример возвращаемого значения:
 * "55.8°N"
 */
export function formatCoordinate(
    value: number, // координата
    positiveDirection: string, //  Буква для положительного значения (например, 'N' для северной широты или 'E' для восточной долготы)
    negativeDirection: string // negativeDirection: Буква для отрицательного значения ('S' для южной или 'W' для западной)
) {
    //  если число больше или равно нулю, берется positiveDirection, иначе negativeDirection
    const direction = value >= 0 ? positiveDirection : negativeDirection;

    return `${Math.abs(value).toFixed(1)}°${direction}`;
}

/** Форматирует масштаб и координаты центра карты.
 * Пример возвращаемого значения:
 * "Zoom 12.3 · 55.8°N · 37.6°E"
 */
export function formatMapView(zoom: number, longitude: number, latitude: number) {
    return [
        `Zoom ${zoom.toFixed(1)}`,
        formatCoordinate(latitude, 'N', 'S'),
        formatCoordinate(longitude, 'E', 'W'),
    ].join(' · ');
}
