#!/bin/sh



# ==============================================================================
# КРАТКОЕ ОПИСАНИЕ ПРОЦЕССА ДЕПЛОЯ (ЧТО ДЕЛАЕТ ЭТОТ СКРИПТ ПО ШАГАМ):
#
# Шаг 1: Проверяет, что все секреты из SourceCraft переданы в скрипт
# Шаг 2: убеждается, что index.html не пустой и ссылки ведут на S3
# Шаг 3: Очищает S3 от старого index.html (он должен быть только на nginx)
# Шаг 4: Загружает статику в S3 с коротким кэшем (1 час), удаляя старые файлы.
# Шаг 5: Загружает тяжелые JS/CSS (с хэшами Vite) в S3 с вечным кэшем (1 год), не удаляя старые.
# Шаг 6: подключается к серверу (VM) через SSH-ключ
# Шаг 7: Копирует index.html и конфиг Nginx во временную папку сервера /tmp.
# Шаг 8: Создает бэкап текущей живой версии сайта на сервере в папке /var/backups/.
# Шаг 9: заменяет старые файлы новыми на диске сервера
# Шаг 10: Проверяет синтаксис нового конфига Nginx внутри Docker-контейнера.
#         -> Если ошибка: автоматически восстанавливает сайт из бэкапа и останавливает деплой.
#         -> Если всё ОК: обновляет настройки Nginx 
# Шаг 11: Делает проверочный запрос на сайт и подтверждает успешный деплой
# ==============================================================================

# Скрипт запускается из корня репозитория после production-сборки frontend
#  останавливаем скрипт при любой ошибке или пустой переменной
set -eu

: "${S3_BUCKET_NAME:?Не задан S3_BUCKET_NAME}"
: "${S3_ENDPOINT_URL:?Не задан S3_ENDPOINT_URL}"
: "${AWS_ACCESS_KEY_ID:?Не задан AWS_ACCESS_KEY_ID}"
: "${AWS_SECRET_ACCESS_KEY:?Не задан AWS_SECRET_ACCESS_KEY}"
: "${VITE_ASSET_BASE_URL:?Не задан VITE_ASSET_BASE_URL}"
: "${TARGET_HOST:?Не задан TARGET_HOST}"
: "${TARGET_SSH_USER:?Не задан TARGET_SSH_USER}"
: "${TARGET_DEPLOY_DIR:?Не задан TARGET_DEPLOY_DIR}"
: "${DEPLOY_SSH_PRIVATE_KEY:?Не задан DEPLOY_SSH_PRIVATE_KEY}"
: "${DEPLOY_SSH_KNOWN_HOSTS:?Не задан DEPLOY_SSH_KNOWN_HOSTS}"
: "${PUBLIC_APP_URL:?Не задан PUBLIC_APP_URL}"

dist_dir="frontend/dist"
index_file="$dist_dir/index.html"


# проверяем, что файл index.html существует, он не пустой и внутри него есть  VITE_ASSET_BASE_URL (ссылка нa S3)
test -s "$index_file"
grep -Fq "$VITE_ASSET_BASE_URL" "$index_file"

# Удаляем index.html из s3  (если он туда случайно попал) HTML должен храниться только на VM
aws --endpoint-url "$S3_ENDPOINT_URL" s3api delete-object \
    --bucket "$S3_BUCKET_NAME" \
    --key "index.html"

# Мелкие файлы (все кроме index.html и assets) загружаются в S3 с кэшем на 1 час
aws --endpoint-url "$S3_ENDPOINT_URL" s3 sync \
    "$dist_dir/" "s3://$S3_BUCKET_NAME/" \
    --delete \
    --exclude "index.html" \
    --exclude "assets/*" \
    --cache-control "public,max-age=3600"

# Тяжелые файлы (JS, CSS с хэшами Vite) загружаются с кэшем на 1 год
aws --endpoint-url "$S3_ENDPOINT_URL" s3 sync \
    "$dist_dir/assets/" "s3://$S3_BUCKET_NAME/assets/" \
    --delete \
    --cache-control "public,max-age=31536000,immutable"


# В памяти создается временная папка, куда записывается приватный ключ и список проверенных серверов (known_hosts)
ssh_dir="$(mktemp -d)"
key_file="$ssh_dir/id_ed25519"
known_hosts_file="$ssh_dir/known_hosts"
trap 'rm -rf "$ssh_dir"' EXIT HUP INT TERM

printf '%s\n' "$DEPLOY_SSH_PRIVATE_KEY" | tr -d '\r' > "$key_file"
printf '%s\n' "$DEPLOY_SSH_KNOWN_HOSTS" | tr -d '\r' > "$known_hosts_file"
chmod 600 "$key_file" "$known_hosts_file"

ssh_options="-i $key_file -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile=$known_hosts_file"
remote_index="/tmp/skypulse-index-$$.html"
remote_nginx="/tmp/skypulse-frontend-$$.conf"

# index.html отправляется после ассетов, чтобы он никогда не ссылался на недоступный релиз
scp $ssh_options "$index_file" "$TARGET_SSH_USER@$TARGET_HOST:$remote_index"
# Конфигурация frontend nginx обновляется тем же релизом
scp $ssh_options "deploy/nginx/parts/frontend.conf" "$TARGET_SSH_USER@$TARGET_HOST:$remote_nginx"

# Сохраняем предыдущую версию и атомарно заменяем файлы внутри bind-mounted каталогов.
ssh $ssh_options "$TARGET_SSH_USER@$TARGET_HOST" "
    set -eu
    sudo install -d -m 0755 '$TARGET_DEPLOY_DIR/static'
    sudo install -d -m 0755 '/var/backups/skypulse'

    # На первом деплое старых файлов может ещё не быть, поэтому бэкап необязателен.
    sudo rm -f '/var/backups/skypulse/index.html.prev' '/var/backups/skypulse/frontend.conf.prev'
    if [ -f '$TARGET_DEPLOY_DIR/static/index.html' ]; then
        sudo cp -f '$TARGET_DEPLOY_DIR/static/index.html' '/var/backups/skypulse/index.html.prev'
    fi
    if [ -f '$TARGET_DEPLOY_DIR/nginx/parts/frontend.conf' ]; then
        sudo cp -f '$TARGET_DEPLOY_DIR/nginx/parts/frontend.conf' '/var/backups/skypulse/frontend.conf.prev'
    fi

    sudo install -m 0644 '$remote_index' '$TARGET_DEPLOY_DIR/static/index.html.next'
    sudo install -m 0644 '$remote_nginx' '$TARGET_DEPLOY_DIR/nginx/parts/frontend.conf.next'

    # замена старых файлов на новые
    sudo mv -f '$TARGET_DEPLOY_DIR/static/index.html.next' '$TARGET_DEPLOY_DIR/static/index.html'
    sudo mv -f '$TARGET_DEPLOY_DIR/nginx/parts/frontend.conf.next' '$TARGET_DEPLOY_DIR/nginx/parts/frontend.conf'

    # При ошибке nginx возвращаем оба файла предыдущего релиза.
    if ! sudo docker compose -f '$TARGET_DEPLOY_DIR/compose.prod.yml' exec -T nginx nginx -t; then
        if [ -f '/var/backups/skypulse/index.html.prev' ]; then
            sudo cp -f '/var/backups/skypulse/index.html.prev' '$TARGET_DEPLOY_DIR/static/index.html'
        else
            sudo rm -f '$TARGET_DEPLOY_DIR/static/index.html'
        fi
        if [ -f '/var/backups/skypulse/frontend.conf.prev' ]; then
            sudo cp -f '/var/backups/skypulse/frontend.conf.prev' '$TARGET_DEPLOY_DIR/nginx/parts/frontend.conf'
        else
            sudo rm -f '$TARGET_DEPLOY_DIR/nginx/parts/frontend.conf'
        fi
        rm -f '$remote_index' '$remote_nginx'
        exit 1
    fi

    sudo docker compose -f '$TARGET_DEPLOY_DIR/compose.prod.yml' exec -T nginx nginx -s reload
    rm -f '$remote_index' '$remote_nginx'
"

# Финальная проверка подтверждает, что публичный nginx уже отдает новый index.html
curl --fail --silent --show-error "$PUBLIC_APP_URL" | grep -Fq "$VITE_ASSET_BASE_URL"
