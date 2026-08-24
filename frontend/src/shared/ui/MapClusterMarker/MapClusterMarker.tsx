import styles from './MapClusterMarker.module.css';

interface MapClusterMarkerProps {
    count: number;
    label: string;
    variant: 'accent' | 'warning';
    decorative?: boolean;
    onClick?: () => void;
}

const VARIANT_CLASS = {
    accent: styles.variantAccent,
    warning: styles.variantWarning,
} as const;

export function MapClusterMarker({
    count,
    label,
    variant,
    decorative,
    onClick,
}: MapClusterMarkerProps) {
    const className = `${styles.clusterMarker} ${VARIANT_CLASS[variant]}`;

    if (decorative) {
        return (
            <div className={className} aria-hidden="true">
                {count}
            </div>
        );
    }

    return (
        <button
            type="button"
            className={className}
            title={label}
            aria-label={label}
            onClick={onClick}
        >
            {count}
        </button>
    );
}
