from typing import Any

REF_AIRCRAFT_SCHEMA: list[dict[str, Any]] = [
    {"name": "icao24", "type": "string", "required": True},
    {"name": "registration", "type": "string", "required": False},
    {"name": "manufacturername", "type": "string", "required": False},
    {"name": "model", "type": "string", "required": False},
    {"name": "typecode", "type": "string", "required": False},
    {"name": "operator", "type": "string", "required": False},
    {"name": "operatorcallsign", "type": "string", "required": False},
    {"name": "operatoricao", "type": "string", "required": False},
    {"name": "owner", "type": "string", "required": False},
    {"name": "categoryDescription", "type": "string", "required": False},
]

REF_AIRCRAFT_FIELDS = [field["name"] for field in REF_AIRCRAFT_SCHEMA]

REF_AIRPORTS_SCHEMA: list[dict[str, Any]] = [
    {"name": "ident", "type": "string", "required": True},
    {"name": "icao_code", "type": "string", "required": False},
    {"name": "iata_code", "type": "string", "required": False},
    {"name": "name", "type": "string", "required": True},
    {"name": "type", "type": "string", "required": True},
    {"name": "municipality", "type": "string", "required": False},
    {"name": "iso_country", "type": "string", "required": False},
    {"name": "latitude_deg", "type": "double", "required": True},
    {"name": "longitude_deg", "type": "double", "required": True},
]

REF_AIRPORTS_FIELDS = [field["name"] for field in REF_AIRPORTS_SCHEMA]

POSITIONS_RAW_SCHEMA: list[dict[str, Any]] = [
    {"name": "icao24", "type": "string"},
    {"name": "time_position", "type": "int64"},
    {"name": "callsign", "type": "string"},
    {"name": "origin_country", "type": "string"},
    {"name": "last_contact", "type": "int64"},
    {"name": "lat", "type": "double"},
    {"name": "lon", "type": "double"},
    {"name": "baro_altitude", "type": "double"},
    {"name": "geo_altitude", "type": "double"},
    {"name": "on_ground", "type": "boolean"},
    {"name": "velocity", "type": "double"},
    {"name": "true_track", "type": "double"},
    {"name": "vertical_rate", "type": "double"},
    {"name": "squawk", "type": "string"},
    {"name": "spi", "type": "boolean"},
    {"name": "position_source", "type": "int64"},
    {"name": "category", "type": "int64"},
    {"name": "snapshot_time", "type": "int64"},
    {"name": "ingested_at", "type": "int64"},
]

POSITIONS_CURRENT_SCHEMA: list[dict[str, Any]] = [
    {"name": "icao24", "type": "string", "sort_order": "ascending"},
    {"name": "callsign", "type": "string"},
    {"name": "origin_country", "type": "string"},
    {"name": "time_position", "type": "int64"},
    {"name": "last_contact", "type": "int64"},
    {"name": "lat", "type": "double"},
    {"name": "lon", "type": "double"},
    {"name": "baro_altitude", "type": "double"},
    {"name": "geo_altitude", "type": "double"},
    {"name": "on_ground", "type": "boolean"},
    {"name": "velocity", "type": "double"},
    {"name": "true_track", "type": "double"},
    {"name": "vertical_rate", "type": "double"},
    {"name": "squawk", "type": "string"},
    {"name": "spi", "type": "boolean"},
    {"name": "position_source", "type": "int64"},
    {"name": "category", "type": "int64"},
    {"name": "registration", "type": "string"},
    {"name": "manufacturername", "type": "string"},
    {"name": "model", "type": "string"},
    {"name": "typecode", "type": "string"},
    {"name": "operator", "type": "string"},
    {"name": "operatorcallsign", "type": "string"},
    {"name": "operatoricao", "type": "string"},
    {"name": "owner", "type": "string"},
    {"name": "categoryDescription", "type": "string"},
    {"name": "snapshot_time", "type": "int64"},
    {"name": "ingested_at", "type": "int64"},
    {"name": "enriched_at", "type": "int64"},
]

POSITIONS_HISTORY_SCHEMA: list[dict[str, Any]] = [
    {"name": "icao24", "type": "string", "sort_order": "ascending"},
    {"name": "time_position", "type": "int64", "sort_order": "ascending"},
    {"name": "callsign", "type": "string"},
    {"name": "origin_country", "type": "string"},
    {"name": "last_contact", "type": "int64"},
    {"name": "lat", "type": "double"},
    {"name": "lon", "type": "double"},
    {"name": "baro_altitude", "type": "double"},
    {"name": "geo_altitude", "type": "double"},
    {"name": "on_ground", "type": "boolean"},
    {"name": "velocity", "type": "double"},
    {"name": "true_track", "type": "double"},
    {"name": "vertical_rate", "type": "double"},
    {"name": "squawk", "type": "string"},
    {"name": "spi", "type": "boolean"},
    {"name": "position_source", "type": "int64"},
    {"name": "category", "type": "int64"},
    {"name": "registration", "type": "string"},
    {"name": "manufacturername", "type": "string"},
    {"name": "model", "type": "string"},
    {"name": "typecode", "type": "string"},
    {"name": "operator", "type": "string"},
    {"name": "operatorcallsign", "type": "string"},
    {"name": "operatoricao", "type": "string"},
    {"name": "owner", "type": "string"},
    {"name": "categoryDescription", "type": "string"},
    {"name": "snapshot_time", "type": "int64"},
    {"name": "ingested_at", "type": "int64"},
    {"name": "enriched_at", "type": "int64"},
]

# Одна строка на сервис-поставщик: бэкенд по ней отличает «пайплайн стоит»
# от «в этом bbox честно нет бортов».
INGEST_HEARTBEAT_SCHEMA: list[dict[str, Any]] = [
    {"name": "service", "type": "string", "sort_order": "ascending", "required": True},
    {"name": "status", "type": "string", "required": True},
    {"name": "updated_at", "type": "int64", "required": True},
    {"name": "last_success_at", "type": "int64", "required": False},
    {"name": "resumes_at", "type": "int64", "required": False},
    {"name": "credits_remaining", "type": "int64", "required": False},
]
