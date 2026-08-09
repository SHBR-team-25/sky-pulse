import {
    AverageDataBadge,
    EmergencyBadge,
    FlightsBadge,
    makeDashboardMock,
} from '@/entities/dashboardData';
import styles from './Dashboard.module.css';
// import { useDashboardData } from '@/features/getDashboardData';
import { RangeDatePicker } from '@gravity-ui/date-components';
import { dateTime, type DateTime } from '@gravity-ui/date-utils';
import { useMemo, useState } from 'react';
import { Loader, Alert } from '@gravity-ui/uikit';

type Range = { start: DateTime; end: DateTime };

function getInitialRange(): Range {
    const today = dateTime();

    return { start: today, end: today };
}

export function Dashboard() {
    const [range, setRange] = useState<Range>(getInitialRange);

    const date = useMemo(
        () => ({
            from: range.start.startOf('day').unix(),
            to: range.end.endOf('day').unix(),
        }),
        [range]
    );

    // const { data: dashboardData, isLoading, isError, error } = useDashboardData(date);

    //TODO: изменить на реальные данные
    const dashboardData = makeDashboardMock(date.from, date.to);
    const isLoading = false;
    const isError = false;
    const error = { message: '' };

    const handleRangeUpdate = (value: Range | null) => {
        setRange(value ?? getInitialRange());
    };

    if (isError) return <Alert theme="danger" title="Возникла ошибка" message={error.message} />;

    return (
        <div className={styles.dashboard}>
            <div className={styles.column}>
                <div className={styles.controls}>
                    <RangeDatePicker
                        value={range}
                        onUpdate={handleRangeUpdate}
                        format="DD.MM.YYYY"
                        className={styles.datePicker}
                    />
                </div>

                <div className={styles.badges}>
                    {isLoading ? (
                        <Loader />
                    ) : (
                        <>
                            <EmergencyBadge count={dashboardData?.emergencyCount} />

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

            <div className={styles.chart} aria-label="График">
                <span className={styles.chartPlaceholder}>График появится позже</span>
            </div>
        </div>
    );
}
