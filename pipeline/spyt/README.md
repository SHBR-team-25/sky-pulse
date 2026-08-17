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
|python pipeline/spyt/launch/run_streaming.py --skip-upload|Не перезаливать джобу (если она уже актуальна в Cypress)|

## Запуск пакетных джоб

|Команда|Описание|
|-------|--------|
|python pipeline/spyt/launch/run_segment.py|Сегментировать новые позиции в рейсы; запускать раз в 15 минут|
|python pipeline/spyt/launch/run_aggregate.py|Пересчитать витрины дашборда; запускать раз в час|

Расписание задаётся внешним оркестратором. `job_segment` хранит watermark последнего
успешного запуска в `pipeline_job_state`. Радиус поиска аэропорта и таймаут рейса
настраиваются через `AIRPORT_RADIUS_KM` и `FLIGHT_TIMEOUT_SECONDS`.

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
