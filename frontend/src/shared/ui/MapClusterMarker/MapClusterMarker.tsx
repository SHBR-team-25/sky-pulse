import styles from './MapClusterMarker.module.css';

interface MapClusterMarkerProps {
    count: number;
    label: string;
    variant: 'accent' | 'warning';
    decorative?: boolean;
}

const VARIANT_CLASS = {
    accent: styles.variantAccent,
    warning: styles.variantWarning,
} as const;

export function MapClusterMarker({ count, label, variant, decorative }: MapClusterMarkerProps) {
    const className = `${styles.clusterMarker} ${VARIANT_CLASS[variant]}`;

    if (decorative) {
        return (
            <div className={className} aria-hidden="true">
                {count}
            </div>
        );
    }

    return (
        <div className={className} role="img" tabIndex={0} title={label} aria-label={label}>
            {count}
        </div>
    );
}
