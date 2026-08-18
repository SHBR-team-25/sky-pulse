---
name: yt-position-source
description: Guide for implementing and wiring the YTsaurus-backed PositionRepository in SkyPulse positions-service (reading positions_current / positions_history dynamic tables and mapping rows to the Position domain model). Use when adding or debugging real YT integration behind the positions API.
---

# YT Position Source

Как подключить реальный источник позиций из YTsaurus вместо заглушки
`InMemoryPositionRepository`.

## Контекст

Сервис соответствует блоку `svc_positions` на схеме архитектуры:
- читает **обогащённую** динамическую таблицу `positions_current` — текущие позиции;
- читает `positions_history` — для построения трека борта;
- отдаёт результат клиенту «Карта» через REST (`/api/positions/**`).

Интерфейс доступа к данным уже определён: `com.skypulse.positions.repository.PositionRepository`.
Внедрение — через Spring DI (конструктор), выбор реализации — через `@Profile`.

## Шаги

1. Добавить зависимость YT-клиента (`tech.ytsaurus:ytsaurus-client`) в `build.gradle.kts`.
2. Создать `YtPositionRepository implements PositionRepository` в пакете `repository`,
   пометить `@Repository @Profile("yt")` — тогда заглушка (`@Profile("!yt")`)
   автоматически отключится. Параметры подключения брать из `skypulse.yt.*`
   (`application.yml`) через `@ConfigurationProperties`/`@Value`.
3. Профиль включается `SPRING_PROFILES_ACTIVE=yt` (`.env`) или
   `--spring.profiles.active=yt`.
4. Смаппить строки YT в доменную модель `Position` (ключ джойна — `icao24`).
   Помнить FR4: борт без записи в справочнике всё равно возвращается, поля
   `aircraftType/airline` = `null`.
5. Реализовать три метода порта: `currentPositions(bbox)`, `latestByIcao24`,
   `historyByIcao24(icao24, sinceSeconds)`.

## Проверки

- Не ломать REST-контракт (`api/dto/*` и сигнатуры `PositionsController` — контракт с фронтом).
- Прогнать `./gradlew build` — тесты на заглушке должны остаться зелёными.
- Соблюдать SLA из NFR1: путь «событие → карта» — десятки секунд максимум.

## Ссылки

- Требования и схемы таблиц: `docs/SRS.md` (FR1–FR5, NFR1, NFR3, NFR5).
- Контракт REST: `backend/positions-service/README.md` и Swagger UI (`/swagger-ui.html`).
