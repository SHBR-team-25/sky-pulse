# Pipeline handoff

## Контекст

Pipeline получает наблюдения OpenSky, обогащает их справочником воздушных судов,
сегментирует последовательности позиций в рейсы и строит витрины дашборда в YTsaurus.
OpenSky остаётся источником истины, поэтому качество результата ограничено качеством,
частотой и последовательностью входных наблюдений.

Основные джобы:

- `spyt/jobs/streaming_job.py` читает очередь `positions_raw`, обогащает позиции через
  `ref_aircraft` и записывает `positions_history` и `positions_current`.
- `spyt/jobs/job_segment.py` запускается раз в 15 минут и превращает историю позиций
  в открытые и завершённые рейсы и события аэропортов.
- `spyt/jobs/job_aggregate.py` запускается раз в 5 минут и пересчитывает витрины дашборда.

Схемы таблиц находятся в `bootstrap_service/schemas.py`. Скрипты создания таблиц
находятся рядом с bootstrap service.

## Принятые решения для job_segment

- Рейс начинается только по свежему переходу `on_ground: true → false`.
- Борт, впервые замеченный в воздухе, получает открытый рейс с неизвестным аэропортом
  вылета. Это позволяет не потерять наблюдаемую часть рейса.
- В `flights_open` хранится состояние открытого рейса и предыдущая обработанная точка.
  Состояние переживает границы batch-запусков; локальная переменная предыдущей точки
  сама по себе между запусками не сохраняется.
- Разрыв между точками больше `MAX_TRANSITION_GAP_SECONDS` не считается надёжным
  доказательством взлёта или посадки.
- Посадка подтверждается двумя последовательными ground-точками либо ground-точкой
  и достаточно долгой стоянкой.
- Короткая последовательность `airborne → ground → airborne` считается шумом.
- Смена callsign обновляет метаданные, но не закрывает рейс. Callsign может меняться,
  исчезать или нормализоваться во время одного физического рейса, поэтому он слишком
  ненадёжен как самостоятельная граница.
- Данные обрабатываются по event time с допустимым опозданием. Watermark обновляется
  только после успешной записи результатов.
- Идентификатор рейса детерминирован по `icao24` и времени начала.
- Закрытые рейсы удаляются из dynamic table `flights_open` явным `delete_rows`.
  Python-клиент драйвера берёт токен SPYT из `YT_SECURE_VAULT_YT_TOKEN`, с fallback
  на `YT_TOKEN` для локального запуска; отсутствие credentials завершается сразу,
  а не уходит в длительные HTTP-ретраи.
- Радиус аэропорта, таймаут, максимальный разрыв, подавление ground-глитча и допустимое
  опоздание вынесены в переменные окружения.
- Отдельная очистка зависших `flights_open` не нужна: цикл обходит объединение
  бортов из нового batch и всех состояний `flights_open`. Даже при пустом batch
  вызывается `process_aircraft_points(..., points=[])`, где `until_ts - last_ts`
  сравнивается с timeout. Воздушный рейс закрывается как `timeout`, а состояние
  с последней ground-точкой — как `landing`. Если segment scheduler продолжает работать,
  при остановке OpenSky `flights_open` со временем станет пустой.

Конфигурация по умолчанию:

```text
AIRPORT_RADIUS_KM=15
FLIGHT_TIMEOUT_SECONDS=1800
MAX_TRANSITION_GAP_SECONDS=300
GROUND_GLITCH_MAX_SECONDS=60
ALLOWED_LATENESS_SECONDS=120
```

## Принятые решения для job_aggregate

- `active_flights`, `airborne`, `on_ground`, средние показатели, набор, снижение и
  emergency squawks — моментальный snapshot по свежим строкам `positions_current`.
- `active_flights` равен `airborne`; `dashboard_trend.active_aircraft` получает то же
  значение. `flights_open` для dashboard snapshot не используется.
- Для каждого `icao24` используется только самая свежая допустимая позиция.
- Позиции старше `POSITION_FRESHNESS_SECONDS` и позиции из будущего исключаются.
- Средняя высота и скорость считаются только по свежим бортам в воздухе.
- Набор и снижение считаются только для воздушных бортов.
- События и сегменты выбираются из замкнутого интервала
  `[computed_at - DASHBOARD_WINDOW_SECONDS, computed_at]`.
- События без аэропорта, `flight_id` или корректного направления исключаются.
- Рейсы считаются через уникальный `flight_id`, чтобы повторная строка не увеличивала
  статистику.
- Пустые наборы дают нулевые счётчики. Средние значения при отсутствии воздушных
  бортов остаются `null`.
- Пустое имя производителя и отсутствие записи в `ref_aircraft` дают `Unknown`.
- Порядок топов детерминирован дополнительной сортировкой по ключам.

Конфигурация по умолчанию:

```text
DASHBOARD_WINDOW_SECONDS=86400
POSITION_FRESHNESS_SECONDS=900
AGGREGATE_INTERVAL_SECONDS=300
```

## Streaming job

Стриминговая джоба упала в YTsaurus по `Memory limit exceeded` на драйвере.
У упавшего запуска было `spark.driver.memory=1G`, общий лимит контейнера
около 1.4 GiB, Java RSS достиг примерно 1.45 GB, а Python ещё 49 MB. Также был
один executor с одним core. Trigger был 10 секунд, но каждый microbatch
занимал 45–60 секунд, поэтому queue consumer отставал.

Явной Python-утечки или `collect()` в streaming job нет. Отстающие данные остаются
в queue, а не копятся как Python-объекты драйвера. Основной диагноз —
слишком маленький driver container без запаса на non-heap/native/Python память
в сочетании с недостаточной пропускной способностью.

Внесены изменения:

- `run_streaming.py` теперь передаёт driver memory/overhead, executor memory/cores,
  число executor'ов и `spark.sql.shuffle.partitions`;
- по умолчанию: driver heap 2 GiB, driver overhead 1 GiB, два executor'а,
  по 2 core и 4 GiB на executor, 8 shuffle partitions;
- trigger увеличен с 10 до 30 секунд, чтобы амортизировать высокую
  фиксированную стоимость YTsaurus-записей и checkpoint;
- источнику задан `max_rows_per_partition=50000`, чтобы после простоя один
  microbatch не пытался забрать весь backlog;
- `enriched_df.unpersist()` перенесён в `finally`, чтобы cache снимался и при
  ошибке одной из двух записей;
- все настройки вынесены в CLI и `STREAMING_*` environment variables, задокументированы
  в `.env.example` и `spyt/README.md`.
- YTsaurus Shuffle на demo-кластере отключён: его `StartShuffle` требует
  `SupervisorService.GenerateSignature`, а кластер отвечает
  `Signature generation is unsupported`. Node-local внешний Spark Shuffle Service
  также отключён, поскольку он не видит `.index` в изолированном `/tmp` executor'а.
- После отключения этих двух механизмов Spark всё ещё падал на batch 195 с
  `FetchFailedException`, причиной которого был `NoSuchFileException` для
  `/tmp/.../shuffle_*.index`. Оба executor'а оказались на одном YTsaurus exec-node.
  Spark 4.2 по умолчанию применил отдельную оптимизацию host-local shuffle read:
  executor пытался напрямую открыть файл соседа на том же host вместо сетевого
  запроса к его BlockManager. В YTsaurus sandbox локальные `/tmp` изолированы даже
  при одинаковом hostname, поэтому этот файл для соседа отсутствует. Добавлен
  `spark.shuffle.readHostLocalDisk=false`. Теперь при фиксированных executor'ах
  shuffle-блоки должны запрашиваться по сети у BlockManager владельца; dynamic
  allocation для этой конфигурации включать нельзя.

Безусловный broadcast join для `ref_aircraft` не добавлялся. Справочник OpenSky
содержит сотни тысяч строк и десять строковых полей. Без замера размера
принудительный broadcast сам может увеличить память драйвера. Оставлен обычный
left join.

После развёртывания нужно проверить:

- в параметрах operation есть `-Xmx2g`, driver limit около 3 GiB, два executor'а
  по 2 core;
- driver RSS после первоначального роста выходит на плато, а не растёт от батча к батчу;
- `processedRowsPerSecond > inputRowsPerSecond`, consumer lag уменьшается, а после
  разбора backlog microbatch стабильно укладывается в 30 секунд.
- в Spark Environment присутствуют все три настройки:
  `spark.ytsaurus.shuffle.enabled=false`, `spark.shuffle.service.enabled=false` и
  `spark.shuffle.readHostLocalDisk=false`; в новых ошибках отсутствует стек
  `getHostLocalShuffleData` / `fetchHostLocalBlock`.

Запускать без `--skip-upload`, с прежними consumer и checkpoint. Checkpoint и consumer
не удалять, чтобы продолжить с сохранённого offset.

Проверено:

- известный борт обогащается полями `ref_aircraft`;
- неизвестный борт сохраняется благодаря left join;
- строка с `null icao24` не теряется;
- исходные поля позиции сохраняются;
- `enriched_at` заполняется Unix timestamp;
- все пути запуска обязательны и корректно разбираются.

Обработчик `foreachBatch` вложен в `main`, а запись использует YTsaurus Data Source.
Поэтому запись в `positions_history`, выбор самой свежей строки для
`positions_current`, checkpoint и продвижение queue consumer нельзя честно проверить
обычным локальным unit-тестом без изменения production-кода или тестового YTsaurus.
Это остаётся интеграционным сценарием.

## Тесты и проверки

Запуск из каталога `pipeline`:

```bash
pytest -q
```

Только отдельные джобы:

```bash
pytest -q tests/spyt/test_streaming_job.py
pytest -q tests/spyt/test_job_segment.py
pytest -q tests/spyt/test_job_aggregate.py
```

Дополнительные проверки:

```bash
python -m py_compile spyt/jobs/streaming_job.py
python -m py_compile spyt/jobs/job_segment.py
python -m py_compile spyt/jobs/job_aggregate.py
```

Локальный Spark открывает loopback-сокет для Java gateway. В ограниченном sandbox
тесты могут потребовать отдельного разрешения. Предупреждение PySpark о
`pandas >= 3.0` относится к тестовому окружению; джобы не используют pandas напрямую.

## Оставшиеся риски

- Запись нескольких выходных таблиц одной джобы не атомарна. Падение между записями
  может временно оставить таблицы разных поколений. Для строгой атомарности нужны
  staging-таблицы и переключение поколения на уровне YTsaurus или потребителя.
- `dashboard_trend` дописывается отдельно. Повтор запуска с другим `computed_at`
  создаст ещё одну точку; повтор с тем же ключом зависит от семантики записи dynamic
  table.
- Корректность streaming-записи, checkpoint и queue consumer должна проверяться
  интеграционным тестом на YTsaurus.
- `job_segment` продвигает event-time watermark по настенному времени даже при
  пустом `positions_history`. Если streaming job потом допишет backlog со старым
  `time_position <= watermark`, segment job его уже не обработает. Это отдельный
  архитектурный риск.
- Справочник `ref_aircraft` предполагает одну строку на `icao24`. Дубликаты в
  справочнике могут размножить строки после join в streaming job.
- OpenSky может присылать ошибочный `on_ground`, координаты, callsign или редкие
  наблюдения. Segment job подавляет известные классы шума, но не может восстановить
  факты, которых нет во входных данных.

## Состояние работы

- `job_segment` переработана и покрыта тестами.
- `job_aggregate` переработана и покрыта тестами.
- `streaming_job` и её launcher обновлены после driver OOM; остался обязательный
  производственный замер памяти, batch duration и consumer lag.
- Итоговый локальный прогон: 59 тестов проходят, одно предупреждение PySpark о
  неподдерживаемой пока версии `pandas >= 3.0`.
- Git-коммиты намеренно не создавались и никакие git-операции для фиксации изменений
  выполнять не нужно без прямого запроса пользователя.

## Инцидент job_segment с зависанием на delete_rows — 19 августа 2026

После замены `mode("overwrite")` на явное удаление закрытых рейсов из dynamic table
`flights_open` новая operation перестала завершаться. Spark успевал прочитать и
обработать данные, после чего Python driver зависал на `delete_rows` с растущими
паузами между повторами: примерно 8, 14, 19, 26, 43, 59, 94 и 151 секунда.

В логах были две связанные ошибки:

- запрос к `//sys/client_config` отвечал `Client is missing credentials`;
- `delete_rows` обращался к внутреннему адресу
  `https://hp-0.http-proxies.hackathon.svc.cluster.local` и получал
  `Connection refused`, после чего YT wrapper запускал экспоненциальные ретраи.

Корневая причина находилась в `spyt/jobs/job_segment.py`: отдельный Python
`YtClient`, добавленный для `delete_rows`, искал только переменную `YT_TOKEN`.
Launcher знает токен и использует его для upload/submit, а внутри SPYT operation
credential драйвера доступен под именем `YT_SECURE_VAULT_YT_TOKEN`. Spark YT Data
Source поэтому продолжал работать, а вручную созданный Python-клиент оставался без
авторизации. Предупреждения о занятых портах `27001`–`27003`, incubator modules и
native Hadoop к зависанию отношения не имеют.

Исправлено:

- `create_yt_client()` сначала читает `YT_SECURE_VAULT_YT_TOKEN`, затем использует
  `YT_TOKEN` как fallback для локального запуска;
- если оба значения отсутствуют, job немедленно завершается с `ValueError`, не
  начиная длительные HTTP-ретраи;
- клиент создаётся только если множество закрытых ключей действительно непустое;
- токен намеренно не передаётся аргументом Python-процесса, чтобы секрет не оказался
  в command line operation;
- mocks тестов `delete_rows` принимают служебный keyword `format="json"`.

Проверены `python3 -m py_compile` для `job_segment.py` и `run_segment.py`, а также
`git diff --check`. Повторный pytest в этой сессии не выполнен: в найденных virtualenv
нет модуля `pytest`. Более ранний полный прогон до этого точечного исправления давал
59 пройденных тестов.

Следующее обязательное действие: остановить старую зависшую operation и запустить
`run_segment.py` без `--skip-upload`, иначе в Cypress останется старая версия
`job_segment.py`. После запуска проверить, что в driver log больше нет
`Client is missing credentials`, вызов `delete_rows` завершается, watermark
обновляется, а закрытые ключи исчезают из `//home/hackathon/team25/flights_open`.

## Хронология инцидентов streaming job

1. Изначально джоба запускалась, но спустя время драйвер завершался по
   `Memory limit exceeded`. У него был heap 1 GiB при лимите контейнера около
   1.4 GiB; Java RSS доходил примерно до 1.45 GB, отдельно работал Python-процесс.
   Одновременно один executor с одним core не успевал за входным потоком:
   microbatch при trigger 10 секунд выполнялся 45–60 секунд, consumer lag рос.
2. Для памяти и пропускной способности выставлены driver heap 2 GiB + overhead
   1 GiB, два executor'а по 2 core и 4 GiB, 8 shuffle partitions, trigger 30 секунд
   и лимит 50 000 строк на партицию source в одном microbatch. Очистка cache через
   `unpersist()` перенесена в `finally`.
3. После перехода на два executor'а shuffle начал падать с отсутствующими локальными
   `.index` в `/tmp`: node-local внешний Spark Shuffle Service не имеет доступа к
   файловым системам изолированных executor sandbox. Его отключили настройкой
   `spark.shuffle.service.enabled=false`.
4. Попытка использовать YTsaurus Shuffle дала другую ошибку: `StartShuffle` вызвал
   `SupervisorService.GenerateSignature`, но demo-кластер ответил
   `Signature generation is unsupported`. Поэтому YTsaurus Shuffle отключили через
   `spark.ytsaurus.shuffle.enabled=false`, оставив оба механизма выключенными.
5. Запуск 18 августа 2026 года дошёл до batch 195, но снова упал с
   `FetchFailedException -> NoSuchFileException: /tmp/.../shuffle_*.index`.
   Это не прежний внешний сервис: стек содержит `getHostLocalShuffleData` и
   `fetchHostLocalBlock`. Spark увидел два executor'а на одном hostname и включил
   независимую host-local оптимизацию, несовместимую с раздельными sandbox `/tmp`.
   Исправление: `spark.shuffle.readHostLocalDisk=false`. После развёртывания это
   исправление ещё требует проверки реальным запуском; старые consumer и checkpoint
   сохраняются.

Предупреждения о занятых портах, `native-hadoop`, невозможности FileContext API,
отключении adaptive execution в streaming и отсутствующем checkpoint child `state`
не являются причиной этого падения. Финальные `ForeachBatchUserFuncException`,
`Py4JJavaError` и `StreamingQueryException` — только оболочки исходного shuffle
`FetchFailedException` во время `.save()`.

При продолжении работы сначала прочитать этот файл, затем посмотреть актуальный код и
запустить `pytest -q`, потому что рабочее дерево могло измениться после этого handoff.

## Исправление active flights в job_aggregate — 19 августа 2026

Симптом: `dashboard_totals.active_flights` и `dashboard_trend.active_aircraft`
становились равны нулю при заполненной `flights_open`.

Проверка исходных определений в `docs/database.md` показала, что `active_flights` —
число наблюдаемых бортов в воздухе, а `positions_current` — текущее состояние бортов.
`flights_open` хранит незавершённые flight-сессии и обновляется segment job, поэтому
для моментального dashboard snapshot семантически не подходит. Заполненность этой
таблицы не доказывает наличие свежей телеметрии в момент расчёта.

Причиной неожиданного нуля было слишком узкое окно свежести: позиции старше 300 секунд
отбрасывались, хотя OpenSky, очередь и streaming job могут давать большую задержку.
Кроме того, часовой интервал aggregation давал слишком редкие моментальные снимки.

Исправлено:

- `build_totals()` считает `active_flights` и `airborne` по одному набору свежих строк
  `positions_current` с `on_ground = false`, поэтому эти поля согласованы;
- `dashboard_trend.active_aircraft` формируется из `totals.active_flights`;
- `flights_open` не читается aggregation job;
- окно свежести по умолчанию увеличено с 5 до 15 минут;
- scheduler aggregation по умолчанию запускается каждые 5 минут вместо одного часа;
- исторические показатели аэропортов, маршрутов и производителей при каждом запуске
  всё так же рассчитываются за последние 24 часа;
- параметры вынесены в `POSITION_FRESHNESS_SECONDS=900` и
  `AGGREGATE_INTERVAL_SECONDS=300`;
- тест aggregation проверяет расчёт snapshot по свежим позициям и нули для пустого
  набора;
- описание показателей обновлено в `docs/database.md` и `spyt/README.md`.

Проверены `python3 -m py_compile` для `job_aggregate.py` и `run_aggregate.py`, а также
`git diff --check`. Pytest в текущем окружении не запущен: команда `pytest`
отсутствует (`command not found`). После развёртывания запускать `run_aggregate.py`
без `--skip-upload`, чтобы новая версия job попала в Cypress.
