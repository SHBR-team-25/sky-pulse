# positions-service

Web-бэкенд SkyPulse для позиций самолётов (`svc_positions` на схеме): читает
`positions_current` из YTsaurus, строит треки из `positions_history`, отдаёт их
клиенту «Карта». Аналитика/дашборд — отдельный сервис.

Стек: Java 21 · Gradle · Spring Boot 3.3 · springdoc/Swagger · Checkstyle · JUnit 5.

## Запуск

```bash
cp .env.example .env        # заполнить при подключении YT

# локально (заглушка-источник)
./gradlew bootRun

# в docker
docker compose up --build
```

Чтение из YTsaurus: `./gradlew bootRun --args='--spring.profiles.active=yt'`
(или `SPRING_PROFILES_ACTIVE=yt` в `.env`).

## API

| Метод | Путь | Назначение |
| --- | --- | --- |
| `GET` | `/api/positions` | текущие позиции; опц. bbox `minLat,minLon,maxLat,maxLon` |
| `GET` | `/api/positions/{icao24}` | последняя позиция борта |
| `GET` | `/api/positions/{icao24}/track?sinceSeconds=3600` | трек борта |
| `GET` | `/swagger-ui.html` | Swagger UI — дёргать ручки без фронта |
| `GET` | `/actuator/health` | health-check |

## Команды

```bash
./gradlew build    # компиляция + Checkstyle + тесты
./gradlew test
./gradlew bootRun
```

## Доделать под боевой режим

- Реализовать `PositionRepository` поверх YTsaurus-клиента, пометить `@Profile("yt")`.
- Зафиксировать схемы `positions_current` / `positions_history` (см. `docs/SRS.md`).
- Настроить CORS под домен фронтенда.
