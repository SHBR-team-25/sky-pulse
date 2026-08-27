import type { HTMLAttributes, Ref, RefAttributes } from 'react';
import { MapPin } from '@gravity-ui/icons';
import { Icon } from '@gravity-ui/uikit';
import type { Airport } from '../../model/types';
import styles from './AirportMarker.module.css';

type MarkerElementProps = HTMLAttributes<HTMLElement> & RefAttributes<HTMLElement>;

type AirportMarkerProps = MarkerElementProps &
    (
        | {
              decorative: true;
              airport?: never;
              isSelected?: never;
          }
        | {
              decorative?: false;
              airport: Airport;
              isSelected?: boolean;
          }
    );

export function AirportMarker({
    airport,
    isSelected,
    decorative,
    className,
    ref,
    ...rest
}: AirportMarkerProps) {
    const icon = (
        <span className={styles.airportMarkerIcon} aria-hidden="true">
            <Icon data={MapPin} size={12} />
        </span>
    );

    if (decorative) {
        return (
            <span className={`${styles.airportMarker} ${className ?? ''}`} aria-hidden="true">
                {icon}
            </span>
        );
    }

    const code = airport.iata ?? airport.icao;

    return (
        <button
            {...rest}
            ref={ref as Ref<HTMLButtonElement>}
            className={`${styles.airportMarker} ${isSelected ? styles.airportMarkerSelected : ''} ${className ?? ''}`}
            type="button"
            aria-label={`Аэропорт ${airport.name}, ${code}`}
            aria-pressed={isSelected}
        >
            {icon}
        </button>
    );
}
