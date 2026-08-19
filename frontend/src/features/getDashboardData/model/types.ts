/**
 * Ручки `GET /stats/dashboard` нет в `docs/openapi.yaml` — query расписан руками
 * по прошлой версии спеки. Подробности в `entities/dashboardData/model/legacy-types.ts`.
 */
export type DashboardQuery = {
    /** unix ts, окно агрегации */
    from?: number;
    /** unix ts, окно агрегации */
    to?: number;
};
