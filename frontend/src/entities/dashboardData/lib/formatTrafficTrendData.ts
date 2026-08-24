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
        // Ось всегда часовая: `/stats/dashboard` отдаёт последние STATS_TREND_LIMIT точек
        // с шагом AGGREGATE_INTERVAL_SECONDS, то есть ~8 часов при текущих настройках.
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
