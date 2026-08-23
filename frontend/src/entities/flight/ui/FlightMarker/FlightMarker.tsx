import type { HTMLAttributes, Ref, RefAttributes } from 'react';
import { PlaneFill } from '@gravity-ui/icons';
import { Icon } from '@gravity-ui/uikit';
import { getFlightIconRotation } from '../../lib/flightIconRotation';
import type { Flight } from '../../model/types';
import styles from './FlightMarker.module.css';

type MarkerElementProps = HTMLAttributes<HTMLElement> & RefAttributes<HTMLElement>;

type FlightMarkerProps = MarkerElementProps &
    (
        | {
              decorative: true;
              flightId?: never;
              flight?: never;
              isSelected?: never;
          }
        | {
              decorative?: false;
              flightId: string;
              flight?: Flight;
              isSelected?: boolean;
          }
    );

export function FlightMarker({
    flightId,
    flight,
    isSelected,
    decorative,
    className,
    ref,
    ...rest
}: FlightMarkerProps) {
    const icon = (
        <span
            className={styles.flightMarkerIcon}
            style={{ transform: getFlightIconRotation(flight?.trueTrack) }}
            aria-hidden="true"
        >
            <Icon data={PlaneFill} size={14} />
        </span>
    );

    if (decorative) {
        return (
            <span className={`${styles.flightMarker} ${className ?? ''}`} aria-hidden="true">
                {icon}
            </span>
        );
    }

    return (
        <button
            {...rest}
            // Корневой элемент маркера - кнопка, но снаружи он типизирован как HTMLElement.
            ref={ref as Ref<HTMLButtonElement>}
            className={`${styles.flightMarker} ${className ?? ''}`}
            type="button"
            aria-label={`Рейс ${flight?.callsign ?? flightId}`}
            aria-pressed={isSelected}
        >
            {icon}
        </button>
    );
}
