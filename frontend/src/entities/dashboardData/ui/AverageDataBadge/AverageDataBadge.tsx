import { Alert } from '@gravity-ui/uikit';
import type { DashboardTotals } from '../../model/types';
import styles from './AverageDataBadge.module.css';
import { numberFormatter } from '@/shared/lib/formatters';

interface AverageDataBadgeProps {
    totals: DashboardTotals;
    /** Аэропорты с рейсами за сутки из `/stats/airports`; без него — счётчик справочника из `dashboard_totals` */
    trackedAirports?: number;
}

/** Средние бывают `null`: в окне пересчёта не оказалось ни одного борта с высотой или скоростью */
function formatValue(value: number | null) {
    return value === null ? '—' : numberFormatter.format(value);
}

export function AverageDataBadge({ totals, trackedAirports }: AverageDataBadgeProps) {
    const tiles = [
        {
            key: 'airports',
            label: 'Отслеживаемых аэропортов',
            value: trackedAirports ?? totals.trackedAirports,
        },
        { key: 'altitude', label: 'Средняя высота', value: totals.averageAltitudeM, unit: 'м' },
        { key: 'speed', label: 'Средняя скорость', value: totals.averageSpeedKmh, unit: 'км/ч' },
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
                            <span className={styles.tileValue}>{formatValue(value)}</span>

                            {unit && value !== null && (
                                <span className={styles.tileUnit}>{unit}</span>
                            )}
                        </span>
                    }
                    layout="vertical"
                />
            ))}
        </div>
    );
}
