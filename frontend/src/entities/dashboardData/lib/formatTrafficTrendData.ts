import type { ChartData } from '@gravity-ui/charts';
import type { DashboardTrafficTrendPoint } from '../model/types';

export function formatTrafficTrendData(
    data: DashboardTrafficTrendPoint[],
    isSingleDay: boolean
): ChartData {
    return {
        series: {
            data: [
                {
                    type: 'line',
                    name: 'Количество полётов',
                    data: data.map(({ timestamp, activeFlights }) => ({
                        x: timestamp * 1000,
                        y: activeFlights,
                    })),
                },
            ],
        },
        xAxis: {
            type: 'datetime',
            labels: {
                dateFormat: isSingleDay ? 'HH:mm' : 'DD.MM.YYYY',
            },
            title: {
                text: isSingleDay ? 'Время' : 'Дата',
            },
        },
        yAxis: [
            {
                title: {
                    text: 'Количество полётов',
                },
            },
        ],
    };
}
