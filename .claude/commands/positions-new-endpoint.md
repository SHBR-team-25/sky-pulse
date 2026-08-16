---
description: Добавить новый REST-эндпоинт в positions-service по конвенциям проекта
---

Добавь новый REST-эндпоинт в сервис `backend/positions-service` (Spring Boot),
следуя слоям:

1. **DTO** — новый `record` в `com.skypulse.positions.api.dto` (контракт с фронтом,
   поля плоские и минимальные).
2. **Репозиторий** — при необходимости расширь `repository.PositionRepository` и обнови
   обе реализации (`InMemoryPositionRepository` и YT-реализацию, если есть).
3. **Сервис** — прикладная логика в `service.PositionsService`.
4. **Контроллер** — метод `@GetMapping` в `api.PositionsController`.
5. **Тест** — кейс в `PositionsControllerTest` (`@WebMvcTest` + MockMvc).

Swagger подтянет ручку автоматически из аннотаций (springdoc) — руками openapi
писать не нужно.

После изменений обязательно:

```bash
cd backend/positions-service && ./gradlew build
```

Сборка должна пройти зелёной, включая Checkstyle (0 предупреждений).
Опиши, что за эндпоинт нужен: $ARGUMENTS
