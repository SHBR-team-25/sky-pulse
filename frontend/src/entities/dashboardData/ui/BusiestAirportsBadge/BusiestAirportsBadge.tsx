import { Alert, DefinitionList } from '@gravity-ui/uikit';
import type { DashboardBusiestAirport } from '../../model/types';
import styles from './BusiestAirportsBadge.module.css';
import { numberFormatter } from '@/shared/lib/formatters';

interface BusiestAirportsBadgeProps {
    airports: DashboardBusiestAirport[];
}

export function BusiestAirportsBadge({ airports }: BusiestAirportsBadgeProps) {
    return (
        <Alert
            theme="normal"
            title="Самые загруженные аэропорты по количеству рейсов в сутки"
            layout="vertical"
            className={styles.listAlert}
            message={
                airports.length > 0 ? (
                    <DefinitionList className={styles.list} responsive>
                        {airports.map(({ airport, totalFlights }) => (
                            <DefinitionList.Item
                                key={airport.icao}
                                name={airport.name ?? airport.iata ?? airport.icao}
                            >
                                <span className={styles.value}>
                                    {numberFormatter.format(totalFlights)}
                                </span>
                            </DefinitionList.Item>
                        ))}
                    </DefinitionList>
                ) : (
                    'Нет данных'
                )
            }
        />
    );
}
