import { Alert } from '@gravity-ui/uikit';
import type { DashboardFlightsByPhase } from '../../model/types';
import styles from './FlightsBadge.module.css';

interface FlightsBadgeProps {
    flightsByPhase: DashboardFlightsByPhase;
    activeFlights: number;
}

const PHASE_LABELS: Record<keyof DashboardFlightsByPhase, string> = {
    on_ground: 'На земле',
    climbing: 'Взлетают',
    cruising: 'Крейсируют',
    descending: 'Садятся',
};

const PHASE_ORDER = Object.keys(PHASE_LABELS) as (keyof DashboardFlightsByPhase)[];

export function FlightsBadge({ flightsByPhase, activeFlights }: FlightsBadgeProps) {
    const countFlights = PHASE_ORDER.reduce((sum, phase) => sum + flightsByPhase[phase], 0);

    return (
        <div className={styles.flightsBadge}>
            <Alert
                theme="normal"
                title="Самолётов за период"
                message={
                    <div className={styles.count}>
                        <span className={styles.countValue}>{countFlights}</span>
                        <span className={styles.countHint}>в воздухе: {activeFlights}</span>
                    </div>
                }
                layout="horizontal"
            />

            <Alert
                theme="normal"
                title="По фазам полёта"
                message={
                    <div className={styles.phases}>
                        {PHASE_ORDER.map((phase) => (
                            <div key={phase} className={styles.phaseRow}>
                                <span className={styles.phaseName}>{PHASE_LABELS[phase]}</span>
                                <span className={styles.phaseValue}>{flightsByPhase[phase]}</span>
                            </div>
                        ))}
                    </div>
                }
                layout="vertical"
            />
        </div>
    );
}
