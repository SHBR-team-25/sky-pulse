/** Форматтер времени в текущем часовом поясе. */
export const timeFormatter = new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
});

/** Форматтер времени в часовом поясе UTC. */
export const utcTimeFormatter = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'UTC',
});

/** Форматирует timestamp в секундах как часы и минуты. */
export function formatTime(timestamp: number) {
    return timeFormatter.format(timestamp * 1000);
}

/** Форматирует дату как время UTC */
export function formatUtcTime(date: Date) {
    return `${utcTimeFormatter.format(date)} UTC`;
}

/** Форматтер даты и времени в текущем часовом поясе. */
export const dateTimeFormatter = new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
});

/** Форматирует timestamp в секундах как дату и время. */
export function formatDateTime(timestamp: number) {
    return dateTimeFormatter.format(timestamp * 1000);
}
