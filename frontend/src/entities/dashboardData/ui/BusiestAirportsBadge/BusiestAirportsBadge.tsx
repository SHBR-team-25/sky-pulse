import { Alert, DefinitionList } from '@gravity-ui/uikit';
import type { DashboardBusiestAirport } from '../../model/types';
import styles from './BusiestAirportsBadge.module.css';

interface BusiestAirportsBadgeProps {
    airports: DashboardBusiestAirport[];
}

const numberFormatter = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });

export function BusiestAirportsBadge({ airports }: BusiestAirportsBadgeProps) {
    return (
        <Alert
            theme="normal"
            title="Самые загруженные аэропорты"
            layout="vertical"
            message={
                airports.length > 0 ? (
                    <DefinitionList className={styles.list} responsive>
                        {airports.map(({ airport, totalFlights }) => (
                            <DefinitionList.Item key={airport.icao} name={airport.name}>
                                <span className={styles.value}>
                                    {numberFormatter.format(totalFlights)}
                                </span>
                            </DefinitionList.Item>
                        ))}
                    </DefinitionList>
                ) : (
                    'Нет данных за выбранный период'
                )
            }
        />
    );
}
