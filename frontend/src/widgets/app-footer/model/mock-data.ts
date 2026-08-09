export const footerMock = {
    flightStatuses: [
        { label: 'В пути', value: '12 940', tone: 'success' },
        { label: 'Задержка', value: '1 604', tone: 'warning' },
        { label: 'Отменён', value: '238', tone: 'danger' },
    ],
    technicalInfo: ['Задержка данных 2 с'],
} as const;
