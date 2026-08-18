Все выполнял на WSL так как некоторые шаги для Windows помечены как невыполняемые

```
Внимание

В настоящий момент нет возможности установить YSON биндинги под Windows.
```

# 1. Настройка окружения

Должна быть версия Python 3.8+

```bash
//команда
python3 --version
//пример вывода
Python 3.12.3
```

Должен быть Docker

```bash
//команда
docker --version
//пример вывода
Docker version 28.5.1, build e180ab8
```

Далее дока предлагает скачать скрипт run_local_cluster.sh, но этого делать не надо. Файл docker-compose.yml уже лежит в корне репозитория — скачивать ничего не нужно. Он воспроизводит поведение официального run_local_cluster.sh (два контейнера, yt.backend и yt.frontend, в общей сети), но не зависит от скачивания стороннего скрипта с GitHub при каждом запуске и запускается одной командой на любой ОС с Docker.

# 2. Поднимаем кластер

Чтобы поднять кластер выполните:

```bash
docker compose up -d
```

Дождитесь, пока yt-backend станет healthy (может занять 30-60 секунд. При первом запуске будет очень долгая загрузка, так как тянутся образы ~1.7 GB)

Чтобы убедиться, что всё работает, запустите команду:

```bash
docker ps | grep yt
```

У вас должны быть запущены два контейнера:

- yt.frontend — процессы, связанные с веб-интерфейсом.
- yt.backend — в этом контейнере подняты компоненты YTsaurus кластера.

# Проблемы с переходом

При первом клонировании репозитория с нуля этот раздел можно пропустить — он актуален
только если вы переходите с ручного запуска через `run_local_cluster.sh` на docker-compose.
Если вы использовали официальный скрипт `run_local_cluster.sh` для локального запуска, у вас могут и должны возникнуть проблемы при переходе на docker-compose. Вот их список:

- Переход со скрипта `run_local_cluster.sh` на `docker-compose.yml`: изначально кластер поднимался официальным скриптом, который сам создавал docker-сеть `yt_local_cluster_network` через `docker network create`, без меток compose. После перехода на `docker compose up` это привело к ошибке:

```bash
network yt_local_cluster_network was found but has incorrect label
com.docker.compose.network set to "" (expected: "yt_local_cluster_network")
```

Решение — удалить старые контейнеры и сеть перед первым запуском через compose:

```bash
docker rm -f yt.backend yt.frontend
docker network rm yt_local_cluster_network
```

- Все тот же переход может привести к ошибке и падению контйнера с бэком:

```bash
FileExistsError: [Errno 17] File exists: '/usr/bin/ytserver-all' -> '/tmp/locasaurus/bin/ytserver-query-tracker'
```

Причина: `run_local_cluster.sh` запускает backend с флагом `--rm`, поэтому каждый его
рестарт — гарантированно чистый контейнер. У docker compose такого поведения нет по
умолчанию: если контейнер упал или был остановлен без `docker compose down`, следующий
`docker compose up` переиспользует его же с уже частично инициализированным `/tmp`
внутри контейнера, отсюда и конфликт при повторной раскладке бинарников.

Решение - удалить директорию на хосте:

```bash
docker-compose down
sudo rm -rf /tmp/locasaurus
docker-compose up -d
```