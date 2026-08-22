import { Alert } from '@gravity-ui/uikit';

interface EmergencyBadgeProps {
    count?: number;
}

const pluralRules = new Intl.PluralRules('ru-RU');

const INCIDENT_FORMS: Record<Intl.LDMLPluralRule, string> = {
    zero: 'происшествий',
    one: 'происшествие',
    two: 'происшествия',
    few: 'происшествия',
    many: 'происшествий',
    other: 'происшествия',
};

export function EmergencyBadge({ count }: EmergencyBadgeProps) {
    const isSafe = !count;

    return (
        <Alert
            theme={isSafe ? 'success' : 'warning'}
            title="Количество аварий"
            message={
                isSafe
                    ? 'Происшествий не было'
                    : `Произошло ${count} ${INCIDENT_FORMS[pluralRules.select(count)]}`
            }
        />
    );
}
