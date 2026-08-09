/** Отделяет код авиакомпании от номера рейса.
 * добавляет "-"  между буквами (код авиакомпании) и цифрами (номер рейса)
 */
export function formatFlightNumber(callsign: string | null) {
    return callsign?.replace(/^([A-Z]+)(\d+)$/, '$1 $2') ?? '—';
}

/** Форматирует оставшееся время полёта */
export function formatEta(minutes: number | null) {
    if (minutes === null) {
        return 'неизвестно';
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return hours > 0 ? `${hours} ч ${remainingMinutes} мин` : `${remainingMinutes} мин`;
}
