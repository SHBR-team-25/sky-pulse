import { dateTime, type DateTime } from '@gravity-ui/date-utils';
import type { DashboardQuery } from '../model/types';

export const DASHBOARD_RANGE_FROM_PARAM = 'from';
export const DASHBOARD_RANGE_TO_PARAM = 'to';

export interface DashboardRange {
    start: DateTime;
    end: DateTime;
}

export function getDefaultDashboardRange(): DashboardRange {
    const today = dateTime();

    return { start: today, end: today };
}

export function parseDashboardRange(searchParams: URLSearchParams): DashboardRange {
    const from = Number(searchParams.get(DASHBOARD_RANGE_FROM_PARAM));
    const to = Number(searchParams.get(DASHBOARD_RANGE_TO_PARAM));

    if (!Number.isFinite(from) || from <= 0 || !Number.isFinite(to) || to <= 0) {
        return getDefaultDashboardRange();
    }

    return {
        start: dateTime({ input: from * 1000 }),
        end: dateTime({ input: to * 1000 }),
    };
}

export function toDashboardQuery(range: DashboardRange): Required<DashboardQuery> {
    return {
        from: range.start.startOf('day').unix(),
        to: range.end.endOf('day').unix(),
    };
}
