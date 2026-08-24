import type { ChartData } from '@gravity-ui/charts';
import type { DashboardTrafficTrendPoint } from '../model/types';

export function formatTrafficTrendData(data: DashboardTrafficTrendPoint[]): ChartData {
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
                autoRotation: true,
                dateFormat: 'HH:mm',
            },
            title: {
                text: 'Время',
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
