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
| `GET` | `/api/flights/live` | борта для карты; опц. bbox `minLat,minLon,maxLat,maxLon` |
| `GET` | `/api/flights/{icao24}` | последняя позиция борта |
| `GET` | `/api/flights/{icao24}/track?sinceSeconds=3600` | трек борта |
| `GET` | `/api/pipeline-status` | состояние пайплайна: почему карта пустая |
| `GET` | `/swagger-ui.html` | Swagger UI — дёргать ручки без фронта |
| `GET` | `/actuator/health` | health-check |

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
- Обработчик 5xx: недоступность YTsaurus сейчас отдаётся дефолтным телом Spring
  без поля `message`.
