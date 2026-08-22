# Деплой SkyPulse

Одна VM Ubuntu, docker compose. nginx единственная точка
входа наружу (80/443).

## Состав

- `compose.prod.yml` — реальные `svc_positions`, `svc_analytics` и общий `nginx`.
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
curl http://localhost/api/flights/live
curl http://localhost/api/airports
curl http://localhost/api/stats/dashboard
curl http://localhost/
```

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
- после merge в `main` сначала проверяется готовность общей конфигурации на VM;
- затем ассеты синхронизируются с Object Storage, а старые хэшированные JS/CSS сохраняются для отката;
- затем `index.html` и frontend-конфигурация nginx копируются на VM;
- nginx продолжает проксировать API и отдаёт только HTML frontend;
- в конце публичный `index.html` сравнивается с файлом текущего релиза.

Frontend использует относительный API-адрес `/api`. Значение задаётся публичной
переменной `VITE_API_BASE_URL` в `.sourcecraft/ci.yaml` и не является секретом.

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

Frontend-пайплайн не разворачивает backend и не изменяет `compose.prod.yml` или
`nginx/parts/api.conf`. Перед первым frontend-деплоем backend должен положить
полный репозиторий в `/opt/skypulse`, заполнить `deploy/.env`, подготовить
сертификаты и запустить общий nginx:

```bash
sudo mkdir -p /opt/skypulse
sudo chown "$USER":"$USER" /opt/skypulse
git clone <repo-url> /opt/skypulse
cd /opt/skypulse/deploy
docker compose -f compose.prod.yml up -d --build
```

До изменения Object Storage frontend-пайплайн проверяет наличие
`compose.prod.yml`, `nginx/default.conf`, актуальных API-маршрутов и выполняет
`nginx -t` внутри уже запущенного контейнера. После загрузки ассетов отдельно
проверяются публичное чтение и CORS. Если подготовка backend не закончена,
деплой остановится без изменения S3.

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
