# Деплой SkyPulse

Одна VM Ubuntu, docker compose. nginx единственная точка
входа наружу (80/443).

## Состав

- `compose.prod.yml` — `svc_positions`, `svc_analytics` (сейчас заглушки на
  `hashicorp/http-echo`, закомментирован блок для реального
  `positions-service`), `nginx`.
- `nginx/default.conf` — точка входа, `include` всех файлов из `parts/`.
- `nginx/parts/api.conf` — проксирование на бэкенд. Зона ответственности бэкенда.
- `nginx/parts/frontend.conf` — раздача статики. Зона ответственности фронтенда.
- `static/` — только `index.html`, который nginx отдаёт для всех маршрутов SPA.
- Остальные файлы frontend хранятся в Yandex Object Storage.
- `.env.example` — шаблон переменных окружения.
- `certs/` — сюда certbot кладёт сертификаты.

## Разворачивание с нуля

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker "$USER"   # перелогиниться после этого

git clone <repo-url>
cd <repo>/deploy

cp .env.example .env
nano .env

docker compose -f compose.prod.yml up -d --build
```

Проверка:

```bash
curl http://localhost/api/positions/
curl http://localhost/api/analytics/
curl http://localhost/
```

Когда `positions-service` будет готов раскомментировать его блок в
`compose.prod.yml`, удалить заглушку `svc_positions`, пересобрать (`up -d --build`).

## Сертификат (certbot, standalone)

```bash
sudo docker compose -f compose.prod.yml stop nginx

sudo docker run --rm -it \
  -v "$(pwd)/certs:/etc/letsencrypt" \
  -p 80:80 \
  certbot/certbot certonly --standalone \
  -d ДОМЕН \
  --email ВАШ_EMAIL --agree-tos --no-eff-email

sudo docker compose -f compose.prod.yml start nginx
```

Дальше: в `nginx/default.conf` раскомментировать HTTPS-блок, заменить `ДОМЕН`,
убрать HTTP-only блок сверху, перезапустить nginx.

Продление — та же команда `certonly --standalone` (сертификат на 90 дней).

## CI/CD frontend в SourceCraft

Пайплайн описан в `.sourcecraft/ci.yaml`:

- в pull request запускаются `npm ci`, линтер и production-сборка;
- после merge в `main` ассеты сначала синхронизируются с Object Storage;
- затем `index.html` и frontend-конфигурация nginx копируются на VM;
- nginx продолжает проксировать API и отдаёт только HTML frontend.

Для подключения к текущей VM `TARGET_HOST` равен `skypulse.duckdns.org`.
Если репозиторий на VM лежит не в `/opt/skypulse`, измените
`TARGET_DEPLOY_DIR` в `.sourcecraft/ci.yaml`.

### Секреты SourceCraft

Добавьте в настройках репозитория следующие секреты:

| Имя                        | Значение                                              |
| -------------------------- | ----------------------------------------------------- |
| `AWS_ACCESS_KEY_ID`        | идентификатор статического ключа сервисного аккаунта  |
| `AWS_SECRET_ACCESS_KEY`    | секрет статического ключа сервисного аккаунта         |
| `VITE_YANDEX_MAPS_API_KEY` | ключ JavaScript API Яндекс Карт                       |
| `DEPLOY_SSH_USER`          | пользователь VM с доступом по SSH и `sudo` без пароля |
| `DEPLOY_SSH_PRIVATE_KEY`   | приватный SSH-ключ для деплоя                         |
| `DEPLOY_SSH_KNOWN_HOSTS`   | проверенная строка `known_hosts` для VM               |

### Однократная настройка VM

Пайплайн ожидает репозиторий в `/opt/skypulse`:

```bash
sudo mkdir -p /opt/skypulse
sudo chown "$USER":"$USER" /opt/skypulse
git clone <repo-url> /opt/skypulse
cd /opt/skypulse/deploy
docker compose -f compose.prod.yml up -d --build
```

Пользователю из `DEPLOY_SSH_USER` нужен беспарольный `sudo` для `install`, `cp`,
`mv` и `docker compose`. Пайплайн сохраняет прошлую страницу как
`/var/backups/skypulse/index.html.prev`, проверяет nginx и автоматически
возвращает предыдущие файлы при ошибке конфигурации.

### Однократная настройка Object Storage

Бакет `team25-frontend-static` должен разрешать публичное чтение объектов.
Кроме того, для загрузки JS-модулей с домена приложения нужен CORS:

```bash
aws --endpoint-url=https://storage.yandexcloud.net \
  s3api put-bucket-cors \
  --bucket team25-frontend-static \
  --cors-configuration file://deploy/object-storage-cors.json
```

После настройки CORS первый merge frontend-изменений в `main` автоматически
выполнит полный деплой.
