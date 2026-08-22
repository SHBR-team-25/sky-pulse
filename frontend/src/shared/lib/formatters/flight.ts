import { numberFormatter } from './number';

const MS_TO_KMH = 3.6;

/** Отделяет код авиакомпании от номера рейса.
 * добавляет "-"  между буквами (код авиакомпании) и цифрами (номер рейса)
 */
export function formatFlightNumber(callsign: string | null) {
    return callsign?.replace(/^([A-Z]+)(\d+)$/, '$1 $2') ?? '-';
}

/** Форматирует путевую скорость: сервис отдаёт м/с, показываем км/ч. */
export function formatSpeedKmh(velocityMs: number | null) {
    if (velocityMs === null) {
        return '-';
    }

    return numberFormatter.format(Math.round(velocityMs * MS_TO_KMH));
}
