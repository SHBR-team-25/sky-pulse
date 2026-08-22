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
- `static/` — собранный фронтенд. Сейчас заглушка `index.html`.
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

