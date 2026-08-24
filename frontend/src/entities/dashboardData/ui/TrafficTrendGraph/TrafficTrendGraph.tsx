import { Chart } from '@gravity-ui/charts';
import { useMemo } from 'react';
import type { DashboardTrafficTrendPoint } from '../../model/types';
import { formatTrafficTrendData } from '../../lib/formatTrafficTrendData';
import styles from './TrafficTrendGraph.module.css';

interface TrafficTrendGraphProps {
    data: DashboardTrafficTrendPoint[];
}

export function TrafficTrendGraph({ data }: TrafficTrendGraphProps) {
    const chartData = useMemo(() => formatTrafficTrendData(data), [data]);

    if (!data.length) {
        return <p className={styles.placeholder}>Нет данных</p>;
    }

    return (
        <div className={styles.graph}>
            <Chart data={chartData} />
        </div>
    );
}
