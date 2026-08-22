---
name: yt-position-source
description: Guide for working with the YTsaurus-backed repositories in SkyPulse positions-service (reading positions_current / positions_history / ingest_heartbeat dynamic tables via select_rows and mapping rows to domain models). Use when adding or debugging YT integration behind the positions API.
---

# YT Position Source

Как устроен доступ к данным в `positions-service` и что учитывать, добавляя
новый источник.

## Контекст

Сервис соответствует блоку `svc_positions` на схеме архитектуры:
- читает обогащённую динамическую таблицу `positions_current` — текущие позиции;
- читает `positions_history` — для построения трека борта;
- читает `ingest_heartbeat` — состояние поставщика данных;
- отдаёт результат клиенту «Карта» через REST (`/api/flights/**`,
  `/api/pipeline-status`).

Заглушек в `src/main` нет: сервис всегда ходит в реальный YTsaurus. Фейковые
реализации портов живут только в тестах.

## Как это собрано

- `YtQueryClient` (`@Component`) — единственная точка входа в YT. Ходит в
  HTTP-прокси на `/api/v4/select_rows`, а не через RPC-клиент
  `tech.ytsaurus:ytsaurus-client`: так не нужен ни новый Maven-артефакт, ни
  DNS-хак для RPC-proxy. Ответ приходит в NDJSON — объект на строку, не массив.
- Репозитории (`YtPositionRepository`, `YtPipelineStatusRepository`) собирают
  QL-строку и мапят `JsonNode` в доменные модели. Маппинг — статические методы,
  чтобы их можно было тестировать без поднятия контекста Spring.
- Параметры подключения и пути таблиц — из `skypulse.yt.*` через `@Value`.

## Подводные камни

1. **Подстановка в QL-строку.** Значения из запроса клеятся в текст запроса,
   поэтому всё, что туда попадает, должно быть провалидировано форматом.
   Пример — `ICAO24_PATTERN` (ровно 6 hex-символов).
2. **Отсечка по свежести обязательна.** SPYT-джоба апсертит `positions_current`
   по ключу `icao24` и никогда не удаляет строки. Без условия
   `time_position >= now - N` в выдаче навсегда остаются севшие борта.
3. **Не резать выдачу лимитом.** Пайплайн опрашивает весь мир, и без bbox это
   десятки тысяч строк, но молчаливое усечение показывает пользователю неверную
   картину: набор бортов меняется между запросами без всякой причины. Объём
   решается на стороне клиента или агрегацией, а не отбрасыванием строк.
4. **FR4.** Борт без записи в `ref_aircraft` всё равно возвращается, поля
   `manufacturername`/`model`/`operator` при этом `null`.
5. **Пути таблиц** должны совпадать с `YT_BASE_PATH` пайплайна — расхождение
   дефолтов даёт пустые ответы без единой ошибки в логах.

## Проверки

- Не ломать REST-контракт: `api/dto/*` и сигнатуры контроллеров — договор с
  фронтом, он зафиксирован в `backend/positions-service/openapi.yaml`.
- `./gradlew build` — компиляция, Checkstyle (`maxWarnings=0`) и тесты.
- Соблюдать NFR1: путь «событие → карта» — десятки секунд максимум.

## Ссылки

- Требования: `docs/SRS.md` (FR1–FR5, NFR1, NFR3, NFR5).
- Схемы таблиц: `docs/database.md` и `pipeline/bootstrap_service/schemas.py`.
- Контракт REST: `backend/positions-service/openapi.yaml`, Swagger UI на `/swagger-ui.html`.
