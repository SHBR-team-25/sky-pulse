# Как запустить SkyPulse

Порядок: справочники в YT → ingest пишет позиции → бэкенд отдаёт их фронту.

## 1. Пайплайн (`pipeline/`)

```bash
cd pipeline
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -e ".[dev]"
cp .env.example .env
```

`pipeline/.env`:

| Переменная | Значение |
| --- | --- |
| `YT_PROXY` | `https://http-proxy-hackathon.demo.ytsaurus.tech/` — менять не нужно |
| `YT_TOKEN` | личный токен кластера |
| `YT_BASE_PATH` | `//home/hackathon/<команда>` |
| `OPENSKY_CLIENT_ID` / `OPENSKY_CLIENT_SECRET` | ключи OpenSky |
| `OPENSKY_POLL_INTERVAL_SECONDS` | `15` |
| `OPENSKY_DAILY_CREDIT_BUDGET` | `4000` — стоп-кран на сутки, не регулятор частоты |
| `OPENSKY_BBOX_LAMIN/LOMIN/LAMAX/LOMAX` | опционально; задавать все четыре сразу, иначе bbox игнорируется |


```bash
python -m bootstrap_service.main   # разово: ref_aircraft + ref_airports в YT
python -m ingest_service.main      # поток позиций, работает постоянно
```

## 2. Бэкенд (`backend/positions-service/`)

```bash
cd backend/positions-service
cp .env.example .env
```

`backend/positions-service/.env`:

| Переменная | Значение |
| --- | --- |
| `PORT` | `8080` |
| `YT_PROXY` | тот же прокси, что в пайплайне |
| `YT_TOKEN` | личный токен кластера |
| `YT_POSITIONS_CURRENT_PATH` | `<YT_BASE_PATH>/positions_current` |
| `YT_POSITIONS_HISTORY_PATH` | `<YT_BASE_PATH>/positions_history` |
| `YT_PIPELINE_JOB_STATE_PATH` | `<YT_BASE_PATH>/pipeline_job_state` |
| `YT_REF_AIRPORTS_PATH` | `<YT_BASE_PATH>/ref_airports` |
| `PIPELINE_STALE_AFTER_SECONDS` | `120` |
| `YT_MAX_POSITION_AGE_SECONDS` | `300` |
| `YT_POSITIONS_REFRESH_SECONDS` | `5` |
| `YT_REF_AIRPORTS_CACHE_TTL_SECONDS` | `86400` |
| `YT_CONNECT_TIMEOUT_SECONDS` / `YT_READ_TIMEOUT_SECONDS` | `3` / `10` |

Запуск:

```bash
docker compose up --build
```
## 3. Аналитика (`backend/analytics-service/`)

```bash
cd backend/analytics-service
cp .env.example .env
```

`backend/analytics-service/.env`:

| Переменная | Значение |
| --- | --- |
| `PORT` | `8081` |
| `YT_PROXY` / `YT_TOKEN` | те же, что в пайплайне |
| `YT_DASHBOARD_*_PATH` | `<YT_BASE_PATH>/dashboard_totals`, `_trend`, `_top_airports`, `_routes`, `_manufacturers` |
| `YT_AIRPORT_EVENTS_PATH` | `<YT_BASE_PATH>/airport_events` |
| `YT_FLIGHTS_SEGMENTS_PATH` | `<YT_BASE_PATH>/flights_segments` |
| `YT_POSITIONS_CURRENT_PATH` | `<YT_BASE_PATH>/positions_current` |
| `YT_REF_AIRPORTS_PATH` / `YT_REF_AIRCRAFT_PATH` | `<YT_BASE_PATH>/ref_airports`, `ref_aircraft` |
| `STATS_TOP_LIMIT` / `STATS_TREND_LIMIT` | `10` / `100` |
| `STATS_AIRPORT_WINDOW_SECONDS` | `86400` |
| `STATS_MAX_POSITION_AGE_SECONDS` | `300` |

Запуск:

```bash
docker compose up --build
```

Таблицы `dashboard_*` считает SPYT-джоба, сервис их только читает: пока джоба
не отработала, `/api/stats/dashboard` отвечает `503`. Первый запрос после
старта занимает несколько секунд — читаются справочники аэропортов и ВС,
дальше они живут в памяти сутки.
