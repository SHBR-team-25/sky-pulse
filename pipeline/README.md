# pipeline

Python-часть пайплайна: `bootstrap_service` (разовая загрузка `ref_aircraft`/`ref_airports` в YT), `ingest_service` (пока не реализован).

## Требования

Python 3.11 или 3.12, доступ к кластеру YTsaurus — см. `setup/spyt-env.md` в корне репозитория (токен, адрес прокси, hosts).

## Установка

```
cd pipeline
python -m venv .venv
.venv\Scripts\activate       # Windows
source .venv/bin/activate    # macOS/Linux
pip install -e ".[dev]"
```

## Конфигурация

```
cp .env.example .env
```

Заполнить в `.env`:
- `YT_PROXY` — уже заполнен, менять не нужно.
- `YT_TOKEN` — твой личный токен от кластера (см. `setup/spyt-env.md`, п.1). Не коммитить.
- `YT_BASE_PATH` — директория команды на кластере, например `//home/hackathon/team25`.

## Запуск bootstrap

```
python -m bootstrap_service.main
```

Загружает `ref_aircraft` и `ref_airports` из публичных CSV в YT. Если таблица уже существует — пропускает её, ничего не перезаписывает. Чтобы принудительно пересоздать:

```
python -m bootstrap_service.main --overwrite
```

## Проверки перед коммитом

```
ruff check --fix .
ruff format .
mypy .
pytest
```
# Retention

Bootstrap создаёт `positions_history`, `flights_segments`, `airport_events` и
`dashboard_trend` с TTL `DATA_RETENTION_SECONDS` (по умолчанию 7 дней) и
`min_data_versions=0`. Значение должно быть больше `DASHBOARD_WINDOW_SECONDS`.
`positions_raw` очищается Queue Agent по offset vital consumer, сохраняя прочитанные
строки ещё на `QUEUE_RETAINED_LIFETIME_SECONDS`.

Bootstrap не меняет уже существующие таблицы. Для однократного применения настроек
с remount исторических таблиц выполните из каталога `pipeline`:

```bash
python -m bootstrap_service.apply_retention
```

Перед запуском проверьте registrations и lag: забытый vital consumer блокирует trim.
