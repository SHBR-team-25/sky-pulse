# ref_aircraft
- Тип: статическая таблица
- Ключ: icao24 (так как статическая таблица, может быть не уникальным)
- Наполнение: загружается из CSV-файла aircraftDatabase.csv

| Поле | Тип | Что это |
|---|---|---|
| `icao24` | string | регистрационный номер борта |
| `registration` | Optional<String> | регистрационный номер борта |
| `manufacturername` | Optional<string> | производитель |
| `model` | Optional<string> | модель |
| `typecode` | Optional<string> | код типа ВС |
| `operator` | Optional<string> | эксплуатант |
| `operatorcallsign` | Optional<string> | позывной эксплуатанта |
| `operatoricao` | Optional<string> | ICAO-код эксплуатанта |
| `owner` | Optional<string> | владелец |
| `categoryDescription` | Optional<string> | категория ВС текстом |

Как тянуть из csv
| Поле | Откуда |
|------|--------|
|icao24|icao24|
|registration|registration|
|manufacturername|manufacturername|
|model|model|
|typecode|typecode|
|operator|operator|
|operatorcallsign|operatorcallsign|
|operatoricao|operatoricao|
|owner|owner|
|categoryDescription|categoryDescription|

# ref_airports
Тип: статическая таблица
Ключ: ident (так как статическая таблица, может быть не уникальным)
Наполнение: загружается из CSV-файла airports.csv

| Поле | Тип | Что это |
|---|---|---|
| `ident` | string | код аэропорта |
| `icao_code` | Optional<string> | ICAO-код аэропорта |
| `iata_code` | Optional<string> | IATA-код аэропорта |
| `name` | string | название аэропорта |
| `type` | string | категория аэропорта  |
| `municipality` | Optional<string> | город/населенный пункт |
| `iso_country` | Optional<string> | код страны |
| `latitude_deg` | Double | широта в градусах |
| `longitude_deg` | Double | долгота  в градусах |

Как тянуть из csv
| Поле | Откуда |
|------|--------|
|ident|ident|
|icao_code|icao_code|
|iata_code|iata_code|
|name|name|
|type|type|
|municipality|municipality|
|iso_country|iso_country|
|latitude_deg|latitude_deg|
|longitude_deg|longitude_deg|

# positions_raw 
- Тип: сортированная динамическая таблица (очередь)
- Ключ: (icao24, time_position)
- Наполнение: потоковая загрузка из OpenSky API

| Поле | Тип | Что это |
|---|---|---|
| `icao24` | string | ICAO-24 адрес, часть ключа |
| `time_position` | int64 | Unix timestamp позиции, часть ключа |
| `callsign` | Optional<string> | позывной |
| `origin_country` | string | страна регистрации |
| `last_contact` | int64 | Unix timestamp последнего сообщения  |
| `lat` | double | Широта WGS-84 |
| `lon` | double | Долгота WGS-84 |
| `baro_altitude` | optional<double> | барометрическая высота, м |
| `geo_altitude` | optional<double> | геометрическая высота, м |
| `on_ground` | boolean | на земле или в воздухе |
| `velocity` | optional<double> | путевая скорость, м/с |
| `true_track` | optional<double> | курс, градусы от севера |
| `vertical_rate` | optional<double> | вертикальная скорость, м/с |
| `squawk` | optional<string> | код транспондера |
| `spi` | boolean | специальный индикатор |
| `position_source` | int64 | Источник данных (0=ADS-B, 1=ASTERIX, 2=MLAT, 3=FLARM) |
| `category` | optional<int64> | Категория ВС по ADS-B |
| `snapshot_time` | int64 | время запроса снапшота |
| `ingested_at` | int64 | время попадания в очередь |

Как тянуть из API
| Поле | Индекс в API |
|------|--------|
|icao24|0|
|callsign|1|
|origin_country|2|
|time_position|3|
|last_contact|4|
|lon|5|
|lat|6|
|baro_altitude|7|
|on_ground|8|
|velocity|9|
|true_track|10|
|vertical_rate|11|
|sensors|12|
|geo_altitude|13|
|squawk|14|
|spi|15|
|position_source|16|
|category|17|

# positions_current
- Тип: сортированная динамическая таблица (текущее состояние бортов)
- Ключ: icao24
- Наполнение: потоковое обогащение из positions_raw + ref_aircraft (джоба job_enrich)

|Поле|Тип|Что это|
|----|---|-------|
|icao24|string|ICAO-24 адрес, ключ|
|callsign|Optional<string>|позывной|
|origin_country|string|страна регистрации|
|time_position|int64|Unix timestamp позиции|
|last_contact|int64|Unix timestamp последнего сообщения|
|lat|double|широта WGS-84|
|lon|double|долгота WGS-84|
|baro_altitude|optional<double>|барометрическая высота, м|
|geo_altitude|optional<double>|геометрическая высота, м|
|on_ground|boolean|на земле или в воздухе|
|velocity|optional<double>|путевая скорость, м/с|
|true_track|optional<double>|курс, градусы от севера|
|vertical_rate|optional<double>|вертикальная скорость, м/с|
|squawk|optional<string>|код транспондера|
|spi|boolean|специальный индикатор|
|position_source|int64|источник данных|
|category|optional<int64>|категория ВС по ADS-B|
|registration|Optional<string>|регистрационный номер|
|manufacturername|Optional<string>|производитель|
|model|Optional<string>|модель|
|typecode|Optional<string>|код типа ВС|
|operator|Optional<string>|эксплуатант|
|operatorcallsign|Optional<string>|позывной эксплуатанта|
|operatoricao|Optional<string>|ICAO-код эксплуатанта|
|owner|Optional<string>|владелец|
|categoryDescription|Optional<string>|категория ВС текстом|
|snapshot_time|int64|время запроса снапшота|
|ingested_at|int64|время попадания в очередь|
|enriched_at|int64|время обогащения|

# positions_history
- Тип: сортированная динамическая таблица (история всех позиций)
- Ключ: (icao24, time_position)
- Наполнение: потоковое обогащение из positions_raw + ref_aircraft (джоба job_enrich)

|Поле|Тип|Что это|
|----|---|-------|
|icao24|string|ICAO-24 адрес, часть ключа|
|time_position|int64|Unix timestamp позиции, часть ключа|
|callsign|Optional<string>|позывной|
|origin_country|string|страна регистрации|
|last_contact|int64|Unix timestamp последнего сообщения|
|lat|double|широта WGS-84|
|lon|double|долгота WGS-84|
|baro_altitude|optional<double>|барометрическая высота, м|
|geo_altitude|optional<double>|геометрическая высота, м|
|on_ground|boolean|на земле или в воздухе|
|velocity|optional<double>|путевая скорость, м/с|
|true_track|optional<double>|курс, градусы от севера|
|vertical_rate|optional<double>|вертикальная скорость, м/с|
|squawk|optional<string>|код транспондера|
|spi|boolean|специальный индикатор|
|position_source|int64|источник данных|
|category|optional<int64>|категория ВС по ADS-B|
|registration|Optional<string>|регистрационный номер|
|manufacturername|Optional<string>|производитель|
|model|Optional<string>|модель|
|typecode|Optional<string>|код типа ВС|
|operator|Optional<string>|эксплуатант|
|operatorcallsign|Optional<string>|позывной эксплуатанта|
|operatoricao|Optional<string>|ICAO-код эксплуатанта|
|owner|Optional<string>|владелец|
|categoryDescription|Optional<string>|категория ВС текстом|
|snapshot_time|int64|время запроса снапшота|
|ingested_at|int64|время попадания в очередь|
|enriched_at|int64|время обогащения|