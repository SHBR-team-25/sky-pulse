# Короткий тест артефактов `flights_segments`

## Цель

За 20–30 минут собрать позиции и найти сегменты, которые похожи не на реальные
рейсы, а на артефакты OpenSky или текущей логики `job_segment`:

- рейсы длительностью 0–120 секунд;
- сегменты из 1–3 точек;
- вылет и прилёт в один аэропорт;
- ложные взлёты из-за краткого `on_ground=false`;
- короткие `timeout`-фрагменты впервые замеченных воздушных судов.

## Подготовка и запуск

Использовать отдельный `YT_BASE_PATH`. Для этого теста установить:

```bash
export DATA_RETENTION_SECONDS=7200
export QUEUE_RETAINED_LIFETIME_SECONDS=300
```

Два часа retention нужны только затем, чтобы история подозрительного борта не
исчезла до разбора. После экспорта переменных пересоздать тестовые таблицы:

```bash
python -m bootstrap_service.main --overwrite
```

Порядок запуска:

1. запустить ingest;
2. запустить streaming job и дождаться заполнения `positions_history`;
3. выполнить `run_segment.py --once`;
4. оставить ingest и streaming ещё на 15–20 минут;
5. снова выполнить `run_segment.py --once`;
6. остановить ingest;
7. через 30–35 минут выполнить `run_segment.py --once`, чтобы закрылись зависшие
   состояния;
8. сразу выполнить YQL-запросы ниже.

Постоянный segment scheduler для этого теста не нужен. Aggregate job также не нужна.

## 1. Общая картина

```sql
SELECT
    closed_reason,
    COUNT(*) AS flights,
    MIN(end_ts - start_ts) AS min_duration_seconds,
    AVG(end_ts - start_ts) AS avg_duration_seconds,
    MAX(end_ts - start_ts) AS max_duration_seconds,
    MIN(point_count) AS min_point_count,
    AVG(point_count) AS avg_point_count,
    MAX(point_count) AS max_point_count
FROM `//home/hackathon/team25/pipeline_segments_test/flights_segments`
GROUP BY closed_reason
ORDER BY closed_reason;
```

Во всех запросах заменить `pipeline_segments_test` на фактическое имя тестового
префикса.

## 2. Короткие и малоточечные сегменты

```sql
SELECT
    flight_id,
    icao24,
    callsign,
    start_ts,
    end_ts,
    end_ts - start_ts AS duration_seconds,
    point_count,
    max_altitude_m,
    departure_icao,
    arrival_icao,
    departure_distance_km,
    arrival_distance_km,
    closed_reason
FROM `//home/hackathon/team25/pipeline_segments_test/flights_segments`
WHERE end_ts - start_ts <= 120 OR point_count <= 3
ORDER BY duration_seconds ASC, point_count ASC
LIMIT 200;
```

Выбрать из результата:

- 2–3 строки `landing` с минимальной длительностью;
- 2–3 строки `timeout` с `point_count=1`;
- несколько коротких timeout с `point_count>1`.

## 3. Один и тот же аэропорт

```sql
SELECT
    flight_id,
    icao24,
    callsign,
    start_ts,
    end_ts,
    end_ts - start_ts AS duration_seconds,
    point_count,
    max_altitude_m,
    departure_icao,
    arrival_icao,
    departure_distance_km,
    arrival_distance_km,
    closed_reason
FROM `//home/hackathon/team25/pipeline_segments_test/flights_segments`
WHERE departure_icao IS NOT NULL
    AND arrival_icao IS NOT NULL
    AND departure_icao = arrival_icao
ORDER BY duration_seconds ASC
LIMIT 100;
```

Короткий сегмент с 2–3 точками особенно похож на шумовой переход
`ground -> airborne -> ground`. Длинный сегмент может быть реальным возвратом или
локальным полётом.

## 4. Базовые нарушения инвариантов

```sql
SELECT
    flight_id,
    icao24,
    start_ts,
    end_ts,
    point_count,
    departure_confidence,
    departure_distance_km,
    arrival_confidence,
    arrival_distance_km,
    closed_reason
FROM `//home/hackathon/team25/pipeline_segments_test/flights_segments`
WHERE end_ts < start_ts
    OR point_count <= 0
    OR departure_confidence < 0
    OR departure_confidence > 1
    OR arrival_confidence < 0
    OR arrival_confidence > 1
    OR departure_distance_km < 0
    OR arrival_distance_km < 0
LIMIT 100;
```

Ожидается пустой результат.

## 5. Восстановление истории подозрительного сегмента

Для каждой выбранной строки подставить её `icao24`, `start_ts - 300` и
`end_ts + 300`:

```sql
SELECT
    icao24,
    time_position,
    on_ground,
    lat,
    lon,
    baro_altitude,
    geo_altitude,
    vertical_rate,
    velocity,
    callsign,
    snapshot_time,
    ingested_at,
    enriched_at
FROM `//home/hackathon/team25/pipeline_segments_test/positions_history`
WHERE icao24 = 'ABC123'
    AND time_position >= 1000000000
    AND time_position <= 1000001000
ORDER BY time_position;
```

Искать последовательности:

- `true -> false -> true`: вероятный ложный взлёт;
- единственная `false`: одноточечный наблюдаемый фрагмент;
- несколько `false`, затем полное исчезновение: обычный timeout;
- `false -> true -> true`: подтверждённая логикой job посадка;
- `false -> true -> false` за 60 секунд или меньше: подавляемый ground glitch;
- разрыв между соседними timestamps больше 300 секунд: переход нельзя считать
  надёжным доказательством взлёта или посадки.

## Критерий завершения

Тест завершён, когда разобраны минимум пять сегментов: два коротких landing,
два timeout и один маршрут с одинаковыми аэропортами. Для каждого нужно записать
фактическую последовательность `time_position/on_ground` и определить, какая ветка
`job_segment.process_aircraft_points()` его создала.
