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
