import {
    AverageDataBadge,
    EmergencyBadge,
    FlightsBadge,
    makeDashboardMock,
    TrafficTrendGraph,
} from '@/entities/dashboardData';
import styles from './Dashboard.module.css';
import {
    DASHBOARD_RANGE_FROM_PARAM,
    DASHBOARD_RANGE_TO_PARAM,
    getDefaultDashboardRange,
    parseDashboardRange,
    toDashboardQuery,
    type DashboardRange,
    // useDashboardData,
} from '@/features/getDashboardData';
import { RangeDatePicker } from '@gravity-ui/date-components';
import { useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { Loader, Alert } from '@gravity-ui/uikit';
import { dateTime } from '@gravity-ui/date-utils';

export function Dashboard() {
    const [searchParams, setSearchParams] = useSearchParams();

    const range = useMemo(() => parseDashboardRange(searchParams), [searchParams]);
    const date = useMemo(() => toDashboardQuery(range), [range]);
    const maxDate = useMemo(() => dateTime().endOf('day'), []);
    // const { data: dashboardData, isLoading, isError, error } = useDashboardData(date);

    //TODO: изменить на реальные данные
    const dashboardData = makeDashboardMock(date.from, date.to);
    const isLoading = false;
    const isError = false;
    const error = { message: '' };

    const handleRangeUpdate = (value: DashboardRange | null) => {
        const nextRange = value ?? getDefaultDashboardRange();
        const nextQuery = toDashboardQuery(nextRange);

        setSearchParams(
            {
                [DASHBOARD_RANGE_FROM_PARAM]: String(nextQuery.from),
                [DASHBOARD_RANGE_TO_PARAM]: String(nextQuery.to),
            },
            { replace: true }
        );
    };

    if (isError) return <Alert theme="danger" title="Возникла ошибка" message={error.message} />;

    return (
        <div className={styles.dashboard}>
            <div className={styles.column}>
                <h2 className={styles.title}>На данный момент</h2>
                <div className={styles.badges}>
                    {isLoading ? (
                        <Loader />
                    ) : (
                        <>
                            {dashboardData && (
                                <>
                                    <FlightsBadge
                                        flightsByPhase={dashboardData.flightsByPhase}
                                        activeFlights={dashboardData.totals.activeFlights}
                                    />

                                    <AverageDataBadge totals={dashboardData.totals} />
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>

            <div className={styles.column}>
                <div className={styles.controls}>
                    <RangeDatePicker
                        value={range}
                        onUpdate={handleRangeUpdate}
                        format="DD.MM.YYYY"
                        className={styles.datePicker}
                        maxValue={maxDate}
                    />
                </div>
                <EmergencyBadge count={dashboardData?.emergencyCount} />
                <div className={styles.chart} aria-label="График">
                    <TrafficTrendGraph data={dashboardData.trafficTrend} />
                </div>
            </div>
        </div>
    );
}
