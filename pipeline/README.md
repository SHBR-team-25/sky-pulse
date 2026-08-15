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
