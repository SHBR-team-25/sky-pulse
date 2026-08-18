import logging

from bootstrap_service.csv_source import iter_csv_rows
from bootstrap_service.schemas import REF_AIRCRAFT_FIELDS, REF_AIRCRAFT_SCHEMA
from bootstrap_service.table_writer import ensure_table
from common.config import load_yt_config
from common.yt_client import make_client

logger = logging.getLogger(__name__)

DEFAULT_SOURCE_URL = "https://opensky-network.org/datasets/metadata/aircraftDatabase.csv"


def _to_row(csv_row: dict[str, str]) -> dict[str, str | None]:
    return {field: csv_row.get(field) or None for field in REF_AIRCRAFT_FIELDS}


def load(source_url: str = DEFAULT_SOURCE_URL, overwrite: bool = False) -> None:
    config = load_yt_config()
    client = make_client(config)
    table_path = f"{config.base_path}/ref_aircraft"

    if not ensure_table(client, table_path, REF_AIRCRAFT_SCHEMA, overwrite):
        logger.info("ref_aircraft already exists at %s, skipping", table_path)
        return

    rows = (_to_row(row) for row in iter_csv_rows(source_url))
    rows = (row for row in rows if row["icao24"])  # icao24 — обязательный ключ
    client.write_table(table_path, rows)
    logger.info("ref_aircraft loaded into %s", table_path)
