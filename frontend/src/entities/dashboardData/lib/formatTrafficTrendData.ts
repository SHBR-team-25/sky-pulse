import type { ChartData } from '@gravity-ui/charts';
import type { DashboardTrafficTrendPoint } from '../model/types';

export function formatTrafficTrendData(data: DashboardTrafficTrendPoint[]): ChartData {
    return {
        series: {
            data: [
                {
                    type: 'line',
                    name: 'Количество полетов',
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
                dateFormat: 'DD.MM.YYYY',
            },
            title: {
                text: 'Дата',
            },
        },
        yAxis: [
            {
                title: {
                    text: 'Количество полетов',
                },
            },
        ],
    };
}
