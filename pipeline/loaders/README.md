## Скрипты управления таблицами

# Создание таблиц

|Команда|Описание|
|-------|--------|
|python create/create_all.py|Создать все таблицы|
|python create/create_ref_aircraft.py|Создать таблицу ref_aircraft|
|python create/create_ref_airports.py|Создать таблицу ref_airports|
|python create/create_positions_raw.py|Создать таблицу positions_raw|
|python create/create_positions_current.py|Создать таблицу positions_current|
|python create/create_positions_history.py|Создать таблицу positions_history|
|python create/create_all.py --proxy localhost:8000|Создать все таблицы с указанием прокси|

# Удаление таблиц
|Команда|Описание|
|-------|--------|
|python delete/delete_all.py|Удалить все таблицы (с подтверждением)|
|python delete/delete_all.py -y|Удалить все таблицы (без подтверждения)|
|python delete/delete_ref_aircraft.py|Удалить ref_aircraft (с подтверждением)|
|python delete/delete_ref_aircraft.py -y|Удалить ref_aircraft (без подтверждения)|
|python delete/delete_ref_airports.py|Удалить ref_airports (с подтверждением)|
|python delete/delete_ref_airports.py -y|Удалить ref_airports (без подтверждения)|
|python delete/delete_positions_raw.py|Удалить positions_raw (с подтверждением)|
|python delete/delete_positions_raw.py -y|Удалить positions_raw (без подтверждения)|
|python delete/delete_positions_current.py|Удалить positions_current (с подтверждением)|
|python delete/delete_positions_current.py -y|Удалить positions_current (без подтверждения)|
|python delete/delete_positions_history.py|Удалить positions_history (с подтверждением)|
|python delete/delete_positions_history.py -y|Удалить positions_history (без подтверждения)|
|python delete/delete_all.py --proxy localhost:8000 -y|Удалить все таблицы с указанием прокси|

# Просмотр информации о таблицах
|Команда|Описание|
|-------|--------|
|python inspect/inspect_all.py|Показать информацию по всем таблицам|
|python inspect/inspect_table.py --table ref_aircraft|Показать информацию о ref_aircraft|
|python inspect/inspect_table.py --table ref_airports|Показать информацию о ref_airports|
|python inspect/inspect_table.py --table positions_raw|Показать информацию о positions_raw|
|python inspect/inspect_table.py --table positions_current|Показать информацию о positions_current|
|python inspect/inspect_table.py --table positions_history|Показать информацию о positions_history|
|python inspect/table_info.py --table //home/ref_aircraft|Показать информацию по полному пути|
|python inspect/inspect_all.py --proxy localhost:8000|Показать информацию с указанием прокси|

# Переменные окружения
|Переменная|Значение по умолчанию|Описание|
|----------|---------------------|--------|
|YT_PROXY|localhost:8000|Прокси кластера YTsaurus|

```bash
export YT_PROXY=localhost:8000
```

# Доступные таблицы

|Таблица|Тип|Ключ|Путь|
|-------|---|----|----|
|ref_aircraft|статическая|icao24|//home/ref_aircraft|
|ref_airports|статическая|ident|//home/ref_airports|
|positions_raw|динамическая, сортированная|(icao24, time_position)|//home/positions_raw|
|positions_current|динамическая, сортированная|icao24|//home/positions_current|
|positions_history|динамическая, сортированная|(icao24, time_position)|//home/positions_history|

# Зависимости
```bash
python3 -m venv ytsaurus-env
source ytsaurus-env/bin/activate
pip install --upgrade pip
pip install ytsaurus-client
pip install ytsaurus-yson
pip install "ytsaurus-client[recommended]"
```
