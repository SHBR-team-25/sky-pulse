# skyPulse pipeline

Пайплайн получает позиции самолётов из OpenSky, обогащает их в SPYT, выделяет
рейсы и рассчитывает витрины дашборда. Подробный контракт вычислений приведён в
[`docs/jobs.md`](../docs/jobs.md).

## Подготовка окружения

Нужны Python 3.11 или 3.12, доступ к YTsaurus и настроенное SPYT-окружение.

```bash
cd pipeline
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env
```

В `.env` обязательно заполните:

- `YT_TOKEN` — личный токен YTsaurus; не добавляйте `.env` в Git;
- `YT_USER` — имя пользователя YTsaurus;
- `YT_BASE_PATH` — корень проекта в Cypress, например `//home/hackathon/team25`;
- `OPENSKY_CLIENT_ID` и `OPENSKY_CLIENT_SECRET` — OAuth-данные OpenSky.

Для первичного подбора ресурсов заполните в `.env`
`CLUSTER_AVAILABLE_CORES` и `CLUSTER_AVAILABLE_MEMORY_GB` суммарными ресурсами,
которые кластер может выделить pipeline, затем выполните:

```bash
python scripts/recommend_resources.py
```

Скрипт читает также `EXPECTED_SNAPSHOT_ROWS` и `OPENSKY_POLL_INTERVAL_SECONDS`,
оценивает входной rows/s и печатает env-блок. Он рекомендует `all` только при
достаточном запасе для одновременной работы streaming, segment и aggregate; иначе
сохраняет настроенный bbox. Результат является стартовой конфигурацией и требует
проверки по batch duration, consumer lag и peak RSS.

Проверьте также `YT_PROXY`, `YT_POOL` и координаты области OpenSky. Пути таблиц
уже строятся внутри `YT_BASE_PATH`; обычно их менять не требуется.

Перед запуском в каждом новом терминале загрузите `.env` в окружение:

```bash
cd pipeline
source ~/spyt-summer-school/bin/activate
set -a
source .env
set +a
```

Для запуска SPYT также должен быть задан `SPARK_CONF_DIR` вашим окружением
YTsaurus. Если launcher предупреждает, что переменная отсутствует, активируйте
выданное для кластера SPYT-окружение перед командами ниже.

## Дерево данных в YTsaurus

Если отдельный путь не переопределён в `.env`, bootstrap создаёт:

```text
YT_BASE_PATH/
├── raw/         positions_raw, positions_raw_consumer
├── reference/   ref_aircraft, ref_airports
├── positions/   positions_current, positions_history
├── flights/     flights_open, flights_segments, airport_events
├── dashboard/   dashboard_totals, dashboard_trend,
│                dashboard_top_airports, dashboard_routes,
│                dashboard_manufacturers
├── system/      pipeline_job_state
└── spark/       code, checkpoints, discovery
```

Bootstrap создаёт родительские map-node рекурсивно. Старые таблицы из корня
`YT_BASE_PATH` автоматически не переносятся: для чистого запуска используйте новый
корень либо перенесите данные отдельно.

## Запуск проекта

Проект работает в трёх терминалах. В каждом сначала активируйте окружение и
загрузите `.env`, как показано выше.

### Терминал 1: bootstrap, streaming и ingest

При первом развёртывании создайте таблицы и загрузите справочники:

```bash
python -m bootstrap_service.main --overwrite
```

Иногда только что созданный consumer ещё не успевает смонтироваться или
зарегистрироваться на очереди. В таком случае повторите bootstrap **без**
`--overwrite`: очередь и consumer уже существуют, и повторный запуск выполнит их
привязку.

```bash
python -m bootstrap_service.main
```

Загрузите streaming job на кластер:

```bash
python spyt/launch/run_streaming.py
```

Дождитесь в выводе строки со `state: running`, затем нажмите `Ctrl+C`. Это завершает
только локальное ожидание: streaming operation уже работает на кластере. После
этого в том же терминале запустите непрерывный ingest:

```bash
python -m ingest_service.main
```

### Терминал 2: сегментация рейсов

```bash
python spyt/launch/run_segment.py
```

Launcher запускает batch job сразу, а затем повторяет её через
`SEGMENT_INTERVAL_SECONDS`.

### Терминал 3: расчёт витрин

```bash
python spyt/launch/run_aggregate.py
```

Launcher запускает batch job сразу, а затем повторяет её через
`AGGREGATE_INTERVAL_SECONDS`.

## Переменные `.env`

### Подключение к YTsaurus и пути

| Переменная | Назначение и влияние |
|---|---|
| `YT_PROXY` | HTTP-proxy кластера. Изменение направляет все операции в другой кластер. |
| `YT_TOKEN` | Токен авторизации bootstrap, ingest и launcher-ов. Неверное значение запрещает чтение, запись и submit. |
| `YT_USER` | Пользователь YTsaurus для окружения и диагностики; текущий Python-код напрямую его не читает. |
| `YT_POOL` | Пул вычислительных операций. В текущих direct-submit launcher-ах сохраняется в конфигурации, но явно в `spark-submit` не передаётся. |
| `YT_BASE_PATH` | Общий корень данных. Меняет все пути, для которых не задано индивидуальное переопределение. |
| `YT_POSITIONS_RAW_PATH` | Очередь сырых наблюдений OpenSky. Меняет цель ingest и источник streaming job. |
| `YT_POSITIONS_RAW_CONSUMER_PATH` | Consumer очереди; его offset определяет, с какого места продолжает streaming job. |
| `YT_REF_AIRCRAFT_PATH` | Справочник самолётов для enrichment и статистики производителей. |
| `YT_REF_AIRPORTS_PATH` | Справочник аэропортов для определения вылета и прилёта. |
| `YT_POSITIONS_CURRENT_PATH` | Последнее известное состояние каждого борта; источник моментальных метрик. |
| `YT_POSITIONS_HISTORY_PATH` | История обогащённых позиций; источник сегментации. |
| `YT_FLIGHTS_OPEN_PATH` | Состояние незавершённых рейсов между запусками segment job. |
| `YT_FLIGHTS_SEGMENTS_PATH` | Завершённые сегменты рейсов. |
| `YT_AIRPORT_EVENTS_PATH` | События вылета и прилёта для аэропортовых метрик. |
| `YT_DASHBOARD_TOTALS_PATH` | Итоговый snapshot основных показателей. |
| `YT_DASHBOARD_TREND_PATH` | Временной ряд активных бортов. |
| `YT_DASHBOARD_TOP_AIRPORTS_PATH` | Витрина самых загруженных аэропортов. |
| `YT_DASHBOARD_ROUTES_PATH` | Витрина популярных маршрутов. |
| `YT_DASHBOARD_MANUFACTURERS_PATH` | Витрина производителей самолётов. |
| `YT_PIPELINE_JOB_STATE_PATH` | Watermark batch-джоб; смена пути начинает их состояние заново. |
| `YT_CHECKPOINT_PATH` | Checkpoint streaming job. Новый путь запускает чтение с новым streaming-состоянием. |
| `YT_CODE_PATH` | Каталог загружаемых Python-файлов джоб. |
| `YT_DISCOVERY_PATH` | Discovery-каталог отдельного SPYT-кластера; direct-submit launcher-ы его сейчас не используют. |

### Хранение и OpenSky

| Переменная | Назначение и влияние |
|---|---|
| `POSITIONS_HISTORY_RETENTION_SECONDS` | TTL `positions_history`; по умолчанию 10 часов. Может быть короче dashboard window, но одновременно задаёт максимальную доступную длину трека для backend/frontend. |
| `FLIGHTS_SEGMENTS_RETENTION_SECONDS` | TTL завершённых сегментов. Должен быть строго больше `DASHBOARD_WINDOW_SECONDS`, иначе суточная статистика маршрутов и производителей будет неполной. |
| `AIRPORT_EVENTS_RETENTION_SECONDS` | TTL событий вылета/прилёта. Должен быть строго больше `DASHBOARD_WINDOW_SECONDS`, иначе суточная статистика аэропортов будет неполной. |
| `DASHBOARD_TREND_RETENTION_SECONDS` | TTL временного ряда активных бортов. Должен быть строго больше `DASHBOARD_WINDOW_SECONDS`. |
| `QUEUE_RETAINED_LIFETIME_SECONDS` | Сколько уже прочитанные строки остаются в очереди после consumer offset. Увеличение помогает диагностике, но расходует место. |
| `OPENSKY_CLIENT_ID`, `OPENSKY_CLIENT_SECRET` | OAuth credentials OpenSky; без них ingest не запускается. |
| `OPENSKY_POLL_INTERVAL_SECONDS` | Пауза между запросами. Меньше — свежее данные и больше расход credits; больше — реже точки и хуже детализация трека. |
| `OPENSKY_SCOPE` | Область запроса: `bbox` (по умолчанию) передаёт границы ниже, `all` запрашивает всю доступную карту OpenSky без bbox-параметров. Режим `all` существенно увеличивает объём данных и расход credits. |
| Фильтрация категорий OpenSky | Ingest сохраняет неизвестные `null`/0/1, самолётные 2–7 и неожиданные числовые значения. Явно не-самолётные категории 8–20 исключаются. Malformed-значения выводятся в диагностическом логе и исключаются. Фильтрация не уменьшает размер ответа и расход credits. |
| `OPENSKY_BBOX_LAMIN`, `OPENSKY_BBOX_LOMIN`, `OPENSKY_BBOX_LAMAX`, `OPENSKY_BBOX_LOMAX` | Южная, западная, северная и восточная границы области. Большая область обычно дороже и создаёт больше данных; эти же границы используются для определения `bbox_exit`. |
| `CLUSTER_AVAILABLE_CORES`, `CLUSTER_AVAILABLE_MEMORY_GB` | Суммарные ресурсы, доступные pipeline; обязательный вход диагностического скрипта, сами launcher-ы эти поля не используют. |
| `EXPECTED_SNAPSHOT_ROWS` | Ожидаемое число строк одного ответа OpenSky для расчёта входной нагрузки диагностическим скриптом. |
| `OPENSKY_TOKEN_URL` | Необязательная замена OAuth endpoint, в основном для тестового сервера. |
| `OPENSKY_STATES_URL` | Необязательная замена endpoint позиций, в основном для тестов. |

После join с `ref_aircraft` streaming job дополнительно использует поле
`icaoaircrafttype`. Для неизвестных OpenSky categories `null`/0/1 типы с префиксами
`H`, `G`, `T` исключаются как подтверждённые helicopter/gyrocopter/tiltrotor;
`L`, `S`, `A` сохраняются как самолёты, а пустые и неожиданные значения сохраняются
как `unknown`. Вердикт записывается в поле `aircraft_class` таблиц
`positions_current` и `positions_history`: сохранённые строки имеют значение
`aircraft` либо `unknown`. Явная OpenSky category имеет приоритет.

При обновлении существующего deployment нужно расширить схемы `ref_aircraft`,
`positions_current` и `positions_history`, затем перезагрузить `ref_aircraft` из CSV.
Флаг bootstrap `--overwrite` удаляет прежнюю таблицу и её данные; для production
history/current требуется недеструктивное изменение схемы либо согласованное
пересоздание.

### Streaming job

| Переменная | Назначение и влияние |
|---|---|
| `STREAMING_DRIVER_MEMORY` | Java heap драйвера. Увеличение снижает риск OOM, но требует больше ресурсов. |
| `STREAMING_DRIVER_MEMORY_OVERHEAD` | Память сверх heap для native/Python процессов драйвера. |
| `STREAMING_EXECUTOR_MEMORY` | Память одного executor. |
| `STREAMING_EXECUTOR_CORES` | Ядра одного executor; больше ядер повышает параллелизм в пределах executor. |
| `STREAMING_NUM_EXECUTORS` | Число фиксированных executor; больше повышает пропускную способность и расход ресурсов. Dynamic allocation здесь включать нельзя. |
| `STREAMING_SHUFFLE_PARTITIONS` | Число shuffle partitions; слишком мало создаёт крупные задачи, слишком много увеличивает накладные расходы. |
| `STREAMING_TRIGGER_SECONDS` | Интервал microbatch. Меньше снижает задержку, но увеличивает частоту дорогих запусков batch. |
| `STREAMING_MAX_ROWS_PER_PARTITION` | Верхняя граница строк source partition за microbatch; уменьшение защищает от большого backlog, но замедляет его разбор. |

### Segment job

| Переменная | Назначение и влияние |
|---|---|
| `SEGMENT_INTERVAL_SECONDS` | Период запуска сегментации. Меньше быстрее публикует рейсы, но чаще запускает Spark operation. |
| `SEGMENT_DRIVER_MEMORY` | Java heap драйвера segment job. Драйвер также запускает Python-процесс, поэтому одного heap недостаточно. |
| `SEGMENT_DRIVER_MEMORY_OVERHEAD` | Запас контейнера драйвера для Python, native и JVM non-heap памяти. |
| `SEGMENT_EXECUTOR_MEMORY` | Память одного executor segment job. |
| `SEGMENT_EXECUTOR_CORES` | Ядра одного executor segment job. |
| `SEGMENT_NUM_EXECUTORS` | Число executor-ов segment job. |
| `SEGMENT_SHUFFLE_PARTITIONS` | Параллелизм сортировки и оконных операций segment job. |
| `AIRPORT_RADIUS_KM` | Максимальная дистанция привязки события к аэропорту. Увеличение даёт больше совпадений и больше риск ложной привязки. |
| `FLIGHT_TIMEOUT_SECONDS` | Сколько хранить рейс без новых наблюдений до закрытия/удаления provisional-состояния. |
| `MAX_TRANSITION_GAP_SECONDS` | Максимальный разрыв между точками непрерывного трека. Больший разрыв чаще склеивает редкие наблюдения. |
| `GROUND_GLITCH_MAX_SECONDS` | Максимальная длительность короткого same-airport ground/air glitch, который подавляется. |
| `ALLOWED_LATENESS_SECONDS` | Запас watermark для поздно обогащённых строк. Увеличение снижает риск пропуска поздних данных, но повторно читает больше строк. |
| `BBOX_EXIT_MARGIN_KM` | Допуск вокруг bbox: за его пределами потерянный рейс закрывается как `bbox_exit`, внутри — как `observation_lost`. |

### Aggregate job и устаревшая конфигурация кластера

| Переменная | Назначение и влияние |
|---|---|
| `DASHBOARD_WINDOW_SECONDS` | Историческое окно событий и сегментов для витрин. Больше — длиннее период статистики. |
| `POSITION_FRESHNESS_SECONDS` | Максимальный возраст `positions_current` для snapshot. Больше включает более старые борта, меньше делает snapshot строже. |
| `AGGREGATE_INTERVAL_SECONDS` | Период пересчёта витрин. Меньше даёт более свежий dashboard и больше Spark-запусков. |
| `WORKER_CORES`, `WORKER_NUM`, `WORKER_MEMORY` | Параметры отдельного SPYT-кластера. Текущие direct-submit launcher-ы их не применяют; изменение сейчас не влияет на джобы. |

## Проверки

```bash
ruff check .
ruff format --check .
mypy .
pytest -q
```

Для применения нового TTL к уже существующим таблицам выполните
`python -m bootstrap_service.apply_retention`. Bootstrap не меняет атрибуты таблиц,
которые пропускает без `--overwrite`. Скрипт применяет к каждой таблице её отдельную
retention-переменную; уменьшение TTL освобождает физическое место асинхронно во время
compaction, а не непосредственно в момент изменения атрибута.
