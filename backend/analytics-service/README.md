# analytics-service

Web-бэкенд SkyPulse для аналитики дашборда (`svc_analytics` на схеме): считает
агрегаты поверх исторических данных из YTsaurus и отдаёт их клиенту «Дашборд»
(FR8, NFR2). Живые позиции на карте — отдельный `positions-service`.

Стек: Java 21 · Gradle · Spring Boot 3.3 · springdoc/Swagger · Checkstyle · JUnit 5.

Сейчас это шаблон: слои, конфигурация и контракт заданы, реализации репозитория
поверх YTsaurus ещё нет — её добавит отдельная задача.

## Запуск

```bash
cp .env.example .env        # заполнить YT_PROXY, YT_TOKEN и пути к таблицам

./gradlew bootRun

# в docker
docker compose up --build
```

Пока нет бина `DashboardRepository`, приложение не поднимется — это осознанно:
заглушек в `src/main` не держим, фейковые реализации портов живут в тестах.

## API

| Метод | Путь | Назначение |
| --- | --- | --- |
| `GET` | `/api/stats/dashboard` | последний посчитанный снапшот агрегатов |
| `GET` | `/swagger-ui.html` | Swagger UI — дёргать ручки без фронта |
| `GET` | `/actuator/health` | health-check |

Форма ответа — `DashboardResponse` из [openapi.yaml](openapi.yaml); он описан
по фактическим таблицам YTsaurus, продуктовый `docs/openapi.yaml` приведён
к нему же.

Окна агрегации у ручки нет намеренно. Таблицы `dashboard_totals`,
`dashboard_top_airports`, `dashboard_routes` и `dashboard_manufacturers`
SPYT-джоба перезаписывает целиком, и единственная временная отметка в них —
`computed_at`. Границ окна, за которое посчитаны агрегаты, в YTsaurus нет,
поэтому `from`/`to` спросить не у чего, а в ответе отдаётся `computedAt`.
Тайм-серия одна — `trafficTrend` из `dashboard_trend`.

Любая ошибка приходит одним телом с полями `timestamp/status/error/message`:
`400` — плохой запрос клиента, `503` — YTsaurus недоступен, `500` — ошибка сервиса.

## Проверки перед коммитом

```bash
./gradlew build   # компиляция + Checkstyle + тесты
```
