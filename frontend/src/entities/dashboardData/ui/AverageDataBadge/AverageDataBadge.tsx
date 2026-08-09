import { Alert } from '@gravity-ui/uikit';
import type { DashboardTotals } from '../../model/types';
import styles from './AverageDataBadge.module.css';

interface AverageDataBadgeProps {
    totals: DashboardTotals;
}

const numberFormatter = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });

export function AverageDataBadge({ totals }: AverageDataBadgeProps) {
    const tiles = [
        { key: 'airports', label: 'Аэропорты', value: totals.trackedAirports },
        { key: 'altitude', label: 'Ср. высота', value: totals.averageAltitudeM, unit: 'м' },
        { key: 'speed', label: 'Ср. скорость', value: totals.averageSpeedKmh, unit: 'км/ч' },
    ];

    return (
        <div className={styles.averageDataBadge}>
            {tiles.map(({ key, label, value, unit }) => (
                <Alert
                    key={key}
                    theme="normal"
                    title={label}
                    message={
                        <span className={styles.tile}>
                            <span className={styles.tileValue}>
                                {numberFormatter.format(value)}
                            </span>

                            {unit && <span className={styles.tileUnit}>{unit}</span>}
                        </span>
                    }
                    layout="vertical"
                />
            ))}
        </div>
    );
}
