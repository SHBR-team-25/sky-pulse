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

FLIGHTS_OPEN_SCHEMA: list[dict[str, Any]] = [
    {"name": "icao24", "type": "string", "sort_order": "ascending"},
    {"name": "flight_id", "type": "string"},
    {"name": "start_ts", "type": "int64"},
    {"name": "last_ts", "type": "int64"},
    {"name": "last_on_ground", "type": "boolean"},
    {"name": "last_lat", "type": "double"},
    {"name": "last_lon", "type": "double"},
    {"name": "last_baro_altitude", "type": "double"},
    {"name": "last_vertical_rate", "type": "double"},
    {"name": "last_callsign", "type": "string"},
    {"name": "departure_icao", "type": "string"},
    {"name": "departure_confidence", "type": "double"},
    {"name": "departure_distance_km", "type": "double"},
    {"name": "point_count", "type": "int64"},
    {"name": "max_altitude_m", "type": "double"},
]

FLIGHTS_SEGMENTS_SCHEMA: list[dict[str, Any]] = [
    {"name": "flight_id", "type": "string", "sort_order": "ascending"},
    {"name": "icao24", "type": "string"},
    {"name": "callsign", "type": "string"},
    {"name": "start_ts", "type": "int64"},
    {"name": "end_ts", "type": "int64"},
    {"name": "departure_icao", "type": "string"},
    {"name": "departure_confidence", "type": "double"},
    {"name": "departure_distance_km", "type": "double"},
    {"name": "arrival_icao", "type": "string"},
    {"name": "arrival_confidence", "type": "double"},
    {"name": "arrival_distance_km", "type": "double"},
    {"name": "point_count", "type": "int64"},
    {"name": "max_altitude_m", "type": "double"},
    {"name": "closed_reason", "type": "string"},
]

AIRPORT_EVENTS_SCHEMA: list[dict[str, Any]] = [
    {"name": "date", "type": "string", "sort_order": "ascending"},
    {"name": "airport_icao", "type": "string", "sort_order": "ascending"},
    {"name": "event_ts", "type": "int64", "sort_order": "ascending"},
    {"name": "flight_id", "type": "string", "sort_order": "ascending"},
    {"name": "direction", "type": "string", "sort_order": "ascending"},
    {"name": "icao24", "type": "string"},
    {"name": "confidence", "type": "double"},
    {"name": "distance_km", "type": "double"},
    {"name": "other_airport_icao", "type": "string"},
]

DASHBOARD_TOTALS_SCHEMA: list[dict[str, Any]] = [
    {"name": "computed_at", "type": "int64"},
    {"name": "active_flights", "type": "int64"},
    {"name": "tracked_airports", "type": "int64"},
    {"name": "avg_altitude_m", "type": "double"},
    {"name": "avg_velocity_mps", "type": "double"},
    {"name": "airborne", "type": "int64"},
    {"name": "on_ground", "type": "int64"},
    {"name": "climbing", "type": "int64"},
    {"name": "descending", "type": "int64"},
    {"name": "emergency_squawks", "type": "int64"},
]

DASHBOARD_TREND_SCHEMA: list[dict[str, Any]] = [
    {"name": "computed_at", "type": "int64", "sort_order": "ascending"},
    {"name": "active_aircraft", "type": "int64"},
]

DASHBOARD_TOP_AIRPORTS_SCHEMA: list[dict[str, Any]] = [
    {"name": "rank", "type": "int64"},
    {"name": "airport_icao", "type": "string"},
    {"name": "departures", "type": "int64"},
    {"name": "arrivals", "type": "int64"},
    {"name": "total_flights", "type": "int64"},
    {"name": "computed_at", "type": "int64"},
]

DASHBOARD_ROUTES_SCHEMA: list[dict[str, Any]] = [
    {"name": "rank", "type": "int64"},
    {"name": "departure_icao", "type": "string"},
    {"name": "arrival_icao", "type": "string"},
    {"name": "flight_count", "type": "int64"},
    {"name": "computed_at", "type": "int64"},
]

DASHBOARD_MANUFACTURERS_SCHEMA: list[dict[str, Any]] = [
    {"name": "manufacturer", "type": "string"},
    {"name": "flight_count", "type": "int64"},
    {"name": "computed_at", "type": "int64"},
]

PIPELINE_JOB_STATE_SCHEMA: list[dict[str, Any]] = [
    {"name": "job_name", "type": "string", "sort_order": "ascending"},
    {"name": "watermark_ts", "type": "int64"},
    {"name": "updated_at", "type": "int64"},
]

CONSUMER_SCHEMA: list[dict[str, Any]] = [
    {"name": "queue_cluster", "type": "string", "sort_order": "ascending", "required": True},
    {"name": "queue_path", "type": "string", "sort_order": "ascending", "required": True},
    {"name": "partition_index", "type": "uint64", "sort_order": "ascending", "required": True},
    {"name": "offset", "type": "uint64", "required": True},
    {"name": "meta", "type": "any", "required": False},
]
