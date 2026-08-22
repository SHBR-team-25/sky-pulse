import { dateTime } from '@gravity-ui/date-utils';
import type { DashboardTrafficTrendPoint } from '../model/types';

/**
 * Укладывается ли тренд в одни сутки. Окна агрегации у `/stats/dashboard` нет, поэтому формат оси
 * времени выбираем по самим точкам: строки в `dashboard_trend` копятся от пересчёта к пересчёту.
 */
export function isSingleDayTrend(points: DashboardTrafficTrendPoint[]): boolean {
    const first = points.at(0);
    const last = points.at(-1);

    if (!first || !last) {
        return true;
    }

    return dateTime({ input: first.timestamp * 1000 }).isSame(
        dateTime({ input: last.timestamp * 1000 }),
        'day'
    );
}
