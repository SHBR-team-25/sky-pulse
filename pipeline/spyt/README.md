# SPYT Pipeline

Управление стриминговыми задачами на Spark поверх YTsaurus.

Кластер хакатона не поддерживает standalone-режим (`spark-launch-yt`) — задачи
запускаются прямым submit'ом через RPC-прокси кластера
(`--master ytsaurus://...`). Перед первым запуском один раз пройдите настройку
окружения из [setup/spyt-env.md](../../setup/spyt-env.md) (Python 3.11/3.12,
Java 17, `pip install ytsaurus-spyt==2.11.0 pyspark==4.2.0`, запись прокси в
`/etc/hosts`) и выполните `source ~/a-summer-school` в терминале, где будете
запускать скрипты ниже — без этого `spark-submit` падает с сообщением про
`master`.

## Запуск стриминга

|Команда|Описание|
|-------|--------|
|python pipeline/spyt/launch/run_streaming.py|Загрузить джобу в Cypress и запустить стриминг с настройками по умолчанию|
|python pipeline/spyt/launch/run_streaming.py --input //home/hackathon/team25/input --output //home/hackathon/team25/output|Указать пути|
|python pipeline/spyt/launch/run_streaming.py --num-executors 2|Указать число executor'ов|
|python pipeline/spyt/launch/run_streaming.py --driver-memory 2g --driver-memory-overhead 1g|Настроить heap и внекучную память драйвера|
|python pipeline/spyt/launch/run_streaming.py --executor-cores 2 --executor-memory 4g|Настроить ресурсы executor'ов|
|python pipeline/spyt/launch/run_streaming.py --trigger-seconds 30 --max-rows-per-partition 50000|Настроить частоту и верхнюю границу microbatch|
|python pipeline/spyt/launch/run_streaming.py --skip-upload|Не перезаливать джобу (если она уже актуальна в Cypress)|

По умолчанию streaming job использует два executor'а по два core, driver heap
2 GiB и driver overhead 1 GiB. Microbatch запускается раз в 30 секунд и читает
не более 50 000 строк из одной партиции queue. Значения можно переопределить
CLI-аргументами или `STREAMING_*` переменными окружения.

На demo-кластере launcher явно отключает YTsaurus Shuffle и внешний Spark Shuffle
Service, а также host-local чтение shuffle. Первый требует недоступную на кластере
генерацию подписей и падает на `StartShuffle` с `Signature generation is unsupported`.
Два других механизма пытаются читать `.index` напрямую с локального диска узла, но
не видят файлы внутри изолированных executor-контейнеров. При фиксированном числе
executor'ов shuffle-блоки остаются у executor'ов и запрашиваются по сети через их
BlockManager. Dynamic allocation с такой конфигурацией включать нельзя.

## Запуск пакетных джоб

|Команда|Описание|
|-------|--------|
|python pipeline/spyt/launch/run_segment.py|Сегментировать новые позиции в рейсы; запускать раз в 15 минут|
|python pipeline/spyt/launch/run_aggregate.py|Пересчитывать витрины дашборда каждые 5 минут|

Расписание задаётся внешним оркестратором. `job_segment` хранит watermark последнего
успешного запуска в `pipeline_job_state`. Радиус поиска аэропорта, таймаут рейса,
максимальный разрыв между ground/airborne-точками и задержка event-time настраиваются
через `AIRPORT_RADIUS_KM`, `FLIGHT_TIMEOUT_SECONDS`, `MAX_TRANSITION_GAP_SECONDS`,
`GROUND_GLITCH_MAX_SECONDS` и `ALLOWED_LATENESS_SECONDS`.

`job_segment` считает посадку подтверждённой после двух последовательных ground-точек
либо после ground-точки и достаточно долгой стоянки. Короткий переход
`airborne → ground → airborne` считается шумом источника. Смена callsign обновляет
метаданные рейса, но сама по себе не является его границей. Аэропорт вылета определяется
только по свежему переходу `ground → airborne`; у борта, впервые замеченного в воздухе,
он остаётся неизвестным.

`job_aggregate` строит snapshot бортов по `positions_current`: учитывает только
позиции не старше `POSITION_FRESHNESS_SECONDS`
и не принимает записи из будущего. Витрины аэропортов, маршрутов и производителей
считаются за интервал `DASHBOARD_WINDOW_SECONDS`, ограниченный с обеих сторон временем
`computed_at`. Средние высота и скорость рассчитываются только по свежим воздушным
бортам.

## Мониторинг

|Команда|Описание|
|-------|--------|
|python pipeline/spyt/monitoring/check_cluster.py|Проверить активные Spark-операции|

## Остановка

|Команда|Описание|
|-------|--------|
|python pipeline/spyt/cleanup/stop_cluster.py|Остановить операцию (с подтверждением)|
|python pipeline/spyt/cleanup/stop_cluster.py -y|Остановить операцию (без подтверждения)|

## Переменные окружения

|Переменная|Значение по умолчанию|Описание|
|----------|---------------------|--------|
|YT_PROXY|localhost:8000|Прокси кластера YTsaurus (на хакатоне — `https://http-proxy-hackathon.demo.ytsaurus.tech/`)|
|YT_TOKEN|(пусто)|Токен доступа к кластеру|
|YT_BASE_PATH|(не задан, используется BASE_PATH)|Домашняя директория команды, например `//home/hackathon/team25`|
|BASE_PATH|//home|Фолбэк для YT_BASE_PATH (локальная разработка)|

```bash
export YT_PROXY=https://http-proxy-hackathon.demo.ytsaurus.tech/
export YT_TOKEN=<ваш токен>
export YT_BASE_PATH=//home/hackathon/<ваша команда>
```

## Зависимости

```bash
pip install ytsaurus-client ytsaurus-spyt==2.11.0 pyspark==4.2.0
```
