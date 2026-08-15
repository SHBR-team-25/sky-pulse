# SPYT Streaming Pipeline

Управление стриминговыми задачами на Spark поверх YTsaurus.

## Запуск кластера

|Команда|Описание|
|-------|--------|
|python pipeline/spyt/launch/launch_cluster.py|Запустить кластер с настройками по умолчанию|
|python pipeline/spyt/launch/launch_cluster.py --workers 5 --cores 16 --memory 64G|Запустить с параметрами|
|python pipeline/spyt/launch/launch_cluster.py --pool my_pool|Запустить в указанном пуле|

## Запуск стриминга

|Команда|Описание|
|-------|--------|
|python pipeline/spyt/launch/run_streaming.py|Запустить стриминг с настройками по умолчанию|
|python pipeline/spyt/launch/run_streaming.py --input //home/input --output //home/output|Указать пути|
|python pipeline/spyt/launch/run_streaming.py --deploy-mode client|Запустить в client режиме|

## Мониторинг

|Команда|Описание|
|-------|--------|
|python pipeline/spyt/monitoring/check_cluster.py|Проверить состояние кластера|

## Остановка

|Команда|Описание|
|-------|--------|
|python pipeline/spyt/cleanup/stop_cluster.py|Остановить кластер (с подтверждением)|
|python pipeline/spyt/cleanup/stop_cluster.py -y|Остановить кластер (без подтверждения)|

## Переменные окружения

|Переменная|Значение по умолчанию|Описание|
|----------|---------------------|--------|
|YT_PROXY|localhost:8000|Прокси кластера YTsaurus|
|BASE_PATH|//home|Базовый путь в YTsaurus для таблиц и данных|
|YT_POOL|default|Вычислительный пул|
|WORKER_CORES|8|Количество ядер на воркера|
|WORKER_NUM|3|Количество воркеров|
|WORKER_MEMORY|32G|Память на воркера|

```bash
export YT_PROXY=localhost:8000
export BASE_PATH=//home
export YT_POOL=default
export WORKER_CORES=8
export WORKER_NUM=3
export WORKER_MEMORY=32G
```

## Зависимости

```bash
pip install ytsaurus-spyt[all]
```