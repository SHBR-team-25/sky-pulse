# skyPulse: актуальная схема джоб

Документ описывает фактическое поведение трёх SPYT-джоб. Пути ниже относительны
`YT_BASE_PATH`; каждую таблицу можно переназначить отдельной переменной `YT_*_PATH`.

## Поток данных

```text
OpenSky → raw/positions_raw → streaming_job
                              ├→ positions/positions_current → job_aggregate
reference/ref_aircraft ───────└→ positions/positions_history → job_segment
                                                                  ├→ flights/flights_open
reference/ref_airports ────────────────────────────────────────────┤
                                                                  ├→ flights/flights_segments
                                                                  └→ flights/airport_events
flights/* + positions_current + ref_aircraft → job_aggregate → dashboard/*
```

## `streaming_job.py`: обогащение позиций

Launcher: `pipeline/spyt/launch/run_streaming.py`.

Это непрерывная Structured Streaming job. Она читает очередь
`raw/positions_raw` через зарегистрированный vital consumer
`raw/positions_raw_consumer`, делает left join со статическим справочником
`reference/ref_aircraft` по `icao24` и добавляет `enriched_at` — Unix-время
обработки. Неизвестный самолёт и строка с пустым `icao24` не теряются: поля
справочника остаются `null`.

Каждый microbatch записывается в две dynamic table:

- `positions/positions_history` хранит обогащённые наблюдения с ключом
  `(icao24, time_position)`; повтор ключа заменяет предыдущую версию;
- `positions/positions_current` получает только самую свежую строку каждого
  `icao24` внутри microbatch и представляет последнее известное состояние борта.

Consumer offset и checkpoint продвигаются средствами YTsaurus/Spark. Путь
checkpoint нельзя без необходимости менять или удалять: новый checkpoint означает
новое streaming-состояние. Размер microbatch ограничивается
`STREAMING_MAX_ROWS_PER_PARTITION`, период задаёт `STREAMING_TRIGGER_SECONDS`.

На demo-кластере выключены YTsaurus Shuffle, внешний Spark Shuffle Service и
host-local чтение shuffle. Executor-ы фиксированы; dynamic allocation для этой
конфигурации использовать нельзя.

## `job_segment.py`: выделение рейсов

Launcher: `pipeline/spyt/launch/run_segment.py`. По умолчанию scheduler запускает
job каждые `SEGMENT_INTERVAL_SECONDS` (15 минут).

Job читает:

- новые строки `positions/positions_history`; курсор `watermark_ts` хранится в
  `system/pipeline_job_state` под именем `job_segment` и движется по `enriched_at`,
  а не по времени самой позиции;
- состояния незавершённых рейсов из `flights/flights_open`;
- координаты аэропортов из `reference/ref_airports`.

Точки каждого борта обрабатываются по `time_position`. Основные правила:

- свежий переход `on_ground: true → false` открывает рейс;
- если борт впервые замечен в воздухе, создаётся provisional-кандидат без известного
  аэропорта вылета; его подтверждает только вторая airborne-точка;
- разрыв больше `MAX_TRANSITION_GAP_SECONDS` разрывает непрерывный трек и не служит
  надёжным доказательством взлёта или посадки;
- посадку подтверждают две последовательные ground-точки либо ground-точка и
  достаточно долгая стоянка;
- короткие `airborne → ground → airborne` и same-airport
  `ground → airborne → ground` подавляются как шум;
- смена, исчезновение или нормализация callsign обновляет метаданные, но сама по
  себе не закрывает рейс;
- рейс без наблюдений закрывается по `FLIGHT_TIMEOUT_SECONDS`: за границей области
  с допуском — как `bbox_exit`, внутри — как `observation_lost`; одноточечный
  provisional-кандидат просто удаляется;
- `flight_id` детерминирован по `icao24` и времени начала.

Результаты:

- `flights/flights_open` — persistent-состояние открытого рейса и предыдущей точки;
  закрытые состояния удаляются через `delete_rows`;
- `flights/flights_segments` — завершённые рейсы: границы, аэропорты и расстояния,
  число точек, максимальная высота и причина закрытия;
- `flights/airport_events` — нормализованные `departure`/`arrival` с аэропортом,
  `flight_id`, временем, уверенностью и расстоянием.

Watermark записывается только после успешной записи результатов. Однако записи в
несколько выходных таблиц не атомарны: падение посередине может временно оставить
разные поколения данных.

## `job_aggregate.py`: витрины дашборда

Launcher: `pipeline/spyt/launch/run_aggregate.py`. По умолчанию scheduler запускает
job каждые `AGGREGATE_INTERVAL_SECONDS` (5 минут). Историческое окно задаётся
`DASHBOARD_WINDOW_SECONDS` (24 часа).

Моментальные показатели строятся по одной самой свежей строке каждого `icao24` из
`positions/positions_current`. Позиции из будущего и старше
`POSITION_FRESHNESS_SECONDS` исключаются. `active_flights` равен числу свежих
бортов с `on_ground=false`; `flights_open` для этого показателя не используется.
Средняя высота и скорость, набор и снижение считаются только для бортов в воздухе.
Emergency — squawk `7500` или `7700`.

События и сегменты берутся из замкнутого окна
`[computed_at - DASHBOARD_WINDOW_SECONDS, computed_at]`. Счётчики рейсов используют
уникальный `flight_id`; события без корректного направления, аэропорта или
`flight_id` отбрасываются. Для маршрутов исключаются короткие same-airport сегменты
с `point_count < 3`. Производитель определяется через `reference/ref_aircraft`,
пустое или отсутствующее значение становится `Unknown`.

Job формирует:

| Таблица | Содержимое | Запись |
|---|---|---|
| `dashboard/dashboard_totals` | active/airborne/on-ground, средние высота и скорость, набор, снижение, emergency | полная замена snapshot |
| `dashboard/dashboard_trend` | `computed_at → active_aircraft` | добавление новой точки |
| `dashboard/dashboard_top_airports` | вылеты, прилёты и уникальные рейсы по аэропортам | полная замена |
| `dashboard/dashboard_routes` | направления и число уникальных завершённых рейсов | полная замена |
| `dashboard/dashboard_manufacturers` | число уникальных рейсов по производителям | полная замена |

Пустые наборы дают нулевые счётчики, а средние при отсутствии воздушных бортов —
`null`. Порядок строк в топах детерминирован дополнительной сортировкой по ключам.

## Связанные процессы

`bootstrap_service` не является SPYT-job: он создаёт таблицы, consumer и загружает
справочники. `ingest_service` опрашивает OpenSky, учитывает rate-limit и пишет сырые
наблюдения в очередь. Полная инструкция запуска и описание всех параметров находятся
в [`pipeline/README.md`](../pipeline/README.md).
