import {
    AverageDataBadge,
    BusiestAirportsBadge,
    EmergencyBadge,
    FlightsBadge,
    toBusiestAirports,
    TrafficTrendGraph,
} from '@/entities/dashboardData';
import styles from './Dashboard.module.css';
import { useDashboardData } from '@/features/getDashboardData';
import { useMemo } from 'react';
import { formatDateTime } from '@/shared/lib/formatters';

export function Dashboard() {
    const { data: dashboardData } = useDashboardData();

    const busiestAirports = useMemo(
        () =>
            dashboardData.airportsTraffic
                ? toBusiestAirports(dashboardData.airportsTraffic.items)
                : dashboardData.topBusiestAirports,
        [dashboardData.airportsTraffic, dashboardData.topBusiestAirports]
    );

    const trackedAirports = dashboardData.airportsTraffic?.items.length;

    return (
        <div className={styles.dashboard}>
            <div className={styles.column}>
                <p className={styles.computedAt}>
                    Данные на {formatDateTime(dashboardData.computedAt)}
                </p>
                <div className={styles.badges}>
                    <FlightsBadge
                        flightsByPhase={dashboardData.flightsByPhase}
                        activeFlights={dashboardData.totals.activeFlights}
                    />

                    <AverageDataBadge
                        totals={dashboardData.totals}
                        trackedAirports={trackedAirports}
                    />
                    <BusiestAirportsBadge airports={busiestAirports} />
                </div>
            </div>

            <div className={styles.column}>
                <h2 className={styles.title}>Динамика количества полетов</h2>
                <EmergencyBadge count={dashboardData.emergencyCount} />
                <div className={styles.chart} aria-label="График">
                    <TrafficTrendGraph data={dashboardData.trafficTrend} />
                </div>
            </div>
        </div>
    );
}
