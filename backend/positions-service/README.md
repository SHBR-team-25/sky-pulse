# positions-service

Web-бэкенд SkyPulse для позиций самолётов (`svc_positions` на схеме): читает
`positions_current` из YTsaurus, строит треки из `positions_history`, отдаёт их
клиенту «Карта». Аналитика/дашборд — отдельный сервис.

Стек: Java 21 · Gradle · Spring Boot 3.3 · springdoc/Swagger · Checkstyle · JUnit 5.

## Запуск

```bash
cp .env.example .env        # заполнить YT_PROXY, YT_TOKEN и пути к таблицам

./gradlew bootRun

# в docker
docker compose up --build
```

Заглушек нет: сервис всегда читает реальный YTsaurus. Без заполненного `.env`
и работающего пайплайна ручки будут отдавать пустые ответы. Пути к таблицам
должны указывать на тот же `YT_BASE_PATH`, что использует пайплайн.

## API

| Метод | Путь | Назначение |
| --- | --- | --- |
| `GET` | `/api/flights/live` | борта для карты; опц. bbox `lonMin,latMin,lonMax,latMax` |
| `GET` | `/api/flights/{icao24}` | последняя позиция борта |
| `GET` | `/api/flights/{icao24}/track?sinceSeconds=3600` | трек борта |
| `GET` | `/api/airports` | справочник аэропортов: `search`, `country`, `sortBy=name`, `page`/`pageSize`, bbox `lonMin,latMin,lonMax,latMax`, `limit` |
| `GET` | `/api/pipeline-status` | состояние пайплайна: едут ли данные |
| `GET` | `/swagger-ui.html` | Swagger UI — дёргать ручки без фронта |
| `GET` | `/actuator/health` | health-check |

`/api/airports` читает статическую таблицу `ref_airports` целиком (`select_rows`
по ней не работает) и держит снапшот в памяти сутки, поэтому первый запрос после
старта занимает десятки секунд, а дальше отвечает мгновенно.

Bbox везде задаётся одним набором имён — `lonMin/latMin/lonMax/latMax`, как
в продуктовом `docs/openapi.yaml`. У `/api/flights/live` он раньше назывался
`minLat/minLon/maxLat/maxLon`; старые имена больше не распознаются, и запрос
с ними вернёт весь мир вместо области.

`/api/pipeline-status` читает `pipeline_job_state` — таблицу watermark'ов
джобов, и берёт тот, что отчитался последним. Она отвечает «данные едут или
встали» (`stale` по watermark'у), но не «почему встали»: причин остановки
в ней нет, поэтому `status` бывает только `ok`/`unknown`, а `resumesAt` всегда
`null`. Чтобы отличать паузу по лимиту кредитов OpenSky от упавшего опроса,
нужен хартбит `ingest_service` — таблицу `ingest_heartbeat` пайплайн умеет
создавать (`pipeline/bootstrap_service/load_ingest_heartbeat.py`), но на
кластере её пока нет.

Любая ошибка приходит одним телом с полями `timestamp/status/error/message` —
дефолтного тела Spring без `message` наружу больше не выходит. Недоступность
или ошибка YTsaurus — это `503`, а не `500`: по коду видно, что сломан источник,
а не сервис. У `404` и `503` текст `message` русский и годится для показа
пользователю, у ошибок Spring MVC (`400`, `405`) — техническое пояснение
по-английски.

Контракт этого сервиса — `openapi.yaml` рядом с этим README: только то, что
реализовано. Общий продуктовый черновик со всеми будущими ручками остаётся
в `docs/openapi.yaml` и с реализацией намеренно не сверяется.

## Команды

```bash
./gradlew build    # компиляция + Checkstyle + тесты
./gradlew test
./gradlew bootRun
```

## Доделать под боевой режим

- Настроить CORS под домен фронтенда.
- Свести дефолтные пути таблиц с `YT_BASE_PATH` пайплайна — сейчас в двух
  `.env.example` они разные.
