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

# flights_open
- Тип: сортированная динамическая таблица (состояние незавершённых рейсов)
- Ключ: `icao24`
- Наполнение: пакетная джоба `job_segment`; строка удаляется после закрытия рейса

|Поле|Тип|Что это|
|----|---|-------|
|`icao24`|string|ICAO-24 адрес, ключ|
|`flight_id`|string|детерминированный идентификатор рейса|
|`start_ts`|int64|Unix timestamp начала рейса|
|`last_ts`|int64|Unix timestamp последнего наблюдения|
|`last_on_ground`|boolean|признак «на земле» последнего наблюдения|
|`last_lat`|optional<double>|последняя известная широта|
|`last_lon`|optional<double>|последняя известная долгота|
|`last_baro_altitude`|optional<double>|последняя барометрическая высота, м|
|`last_vertical_rate`|optional<double>|последняя вертикальная скорость, м/с|
|`last_callsign`|optional<string>|последний известный позывной|
|`departure_icao`|optional<string>|ICAO-код ближайшего аэропорта вылета|
|`departure_confidence`|optional<double>|уверенность привязки аэропорта вылета, от 0 до 1|
|`departure_distance_km`|optional<double>|расстояние от последней наземной точки до аэропорта вылета, км|
|`point_count`|int64|накопленное число наблюдений открытого рейса|
|`max_altitude_m`|optional<double>|накопленная максимальная барометрическая высота, м|

# flights_segments
- Тип: сортированная динамическая таблица (завершённые рейсы)
- Ключ: `flight_id`
- Наполнение: пакетная джоба `job_segment`, только при закрытии рейса

|Поле|Тип|Что это|
|----|---|-------|
|`flight_id`|string|детерминированный идентификатор рейса, ключ|
|`icao24`|string|ICAO-24 адрес борта|
|`callsign`|optional<string>|позывной рейса|
|`start_ts`|int64|Unix timestamp начала рейса|
|`end_ts`|int64|Unix timestamp завершения рейса|
|`departure_icao`|optional<string>|ICAO-код аэропорта вылета|
|`departure_confidence`|optional<double>|уверенность привязки аэропорта вылета|
|`departure_distance_km`|optional<double>|расстояние до аэропорта вылета, км|
|`arrival_icao`|optional<string>|ICAO-код аэропорта прилёта|
|`arrival_confidence`|optional<double>|уверенность привязки аэропорта прилёта|
|`arrival_distance_km`|optional<double>|расстояние до аэропорта прилёта, км|
|`point_count`|int64|число наблюдений в рейсе|
|`max_altitude_m`|optional<double>|максимальная барометрическая высота, м|
|`closed_reason`|string|причина закрытия: `landing`, `timeout` или `coverage_exit`|

# airport_events
- Тип: сортированная динамическая таблица (события аэропортов)
- Ключ: (`date`, `airport_icao`, `event_ts`, `flight_id`, `direction`)
- Наполнение: пакетная джоба `job_segment`; события рейса записываются при его закрытии

|Поле|Тип|Что это|
|----|---|-------|
|`date`|string|UTC-дата события в формате YYYY-MM-DD, часть ключа|
|`airport_icao`|string|ICAO-код аэропорта, часть ключа|
|`event_ts`|int64|Unix timestamp события, часть ключа|
|`flight_id`|string|идентификатор рейса, часть ключа|
|`direction`|string|`departure` или `arrival`, часть ключа|
|`icao24`|string|ICAO-24 адрес борта|
|`confidence`|double|уверенность привязки аэропорта|
|`distance_km`|double|расстояние от события до аэропорта, км|
|`other_airport_icao`|optional<string>|ICAO-код второго аэропорта маршрута|

# dashboard_totals
- Тип: статическая таблица, целиком перезаписывается раз в 5 минут
- Ключ: отсутствует, в таблице одна строка
- Наполнение: пакетная джоба `job_aggregate`

|Поле|Тип|Что это|
|----|---|-------|
|`computed_at`|int64|время расчёта|
|`active_flights`|int64|число наблюдаемых бортов в воздухе на момент расчёта|
|`tracked_airports`|int64|число аэропортов с событиями за последние 24 часа|
|`avg_altitude_m`|optional<double>|средняя барометрическая высота, м|
|`avg_velocity_mps`|optional<double>|средняя скорость, м/с|
|`airborne`|int64|число бортов в воздухе|
|`on_ground`|int64|число бортов на земле|
|`climbing`|int64|число набирающих высоту бортов (`vertical_rate > 1`)|
|`descending`|int64|число снижающихся бортов (`vertical_rate < -1`)|
|`emergency_squawks`|int64|число бортов с кодом `7500` или `7700`|

# dashboard_trend
- Тип: сортированная динамическая таблица
- Ключ: `computed_at`
- Наполнение: пакетная джоба `job_aggregate`, одна новая точка раз в 5 минут

|Поле|Тип|Что это|
|----|---|-------|
|`computed_at`|int64|время точки, ключ|
|`active_aircraft`|int64|число наблюдаемых бортов в воздухе на момент расчёта|

# dashboard_top_airports
- Тип: статическая таблица, целиком перезаписывается раз в 5 минут
- Ключ: отсутствует
- Наполнение: пакетная джоба `job_aggregate` из `airport_events` за последние 24 часа

|Поле|Тип|Что это|
|----|---|-------|
|`rank`|int64|место в рейтинге|
|`airport_icao`|string|ICAO-код аэропорта|
|`departures`|int64|число вылетов за 24 часа|
|`arrivals`|int64|число прилётов за 24 часа|
|`total_flights`|int64|число уникальных рейсов за 24 часа|
|`computed_at`|int64|время расчёта|

# dashboard_routes
- Тип: статическая таблица, целиком перезаписывается раз в 5 минут
- Ключ: отсутствует
- Наполнение: пакетная джоба `job_aggregate` из завершённых рейсов за последние 24 часа

|Поле|Тип|Что это|
|----|---|-------|
|`rank`|int64|место в рейтинге|
|`departure_icao`|string|ICAO-код аэропорта вылета|
|`arrival_icao`|string|ICAO-код аэропорта прилёта|
|`flight_count`|int64|число рейсов по маршруту|
|`computed_at`|int64|время расчёта|

# dashboard_manufacturers
- Тип: статическая таблица, целиком перезаписывается раз в 5 минут
- Ключ: отсутствует
- Наполнение: пакетная джоба `job_aggregate` из `flights_segments × ref_aircraft` за последние 24 часа

|Поле|Тип|Что это|
|----|---|-------|
|`manufacturer`|string|название производителя или `Unknown`|
|`flight_count`|int64|число завершённых рейсов|
|`computed_at`|int64|время расчёта|

# pipeline_job_state
- Тип: сортированная динамическая служебная таблица
- Ключ: `job_name`
- Наполнение: пакетные джобы после успешной обработки интервала

|Поле|Тип|Что это|
|----|---|-------|
|`job_name`|string|имя джобы, ключ|
|`watermark_ts`|int64|верхняя граница успешно обработанного интервала|
|`updated_at`|int64|время обновления состояния|
