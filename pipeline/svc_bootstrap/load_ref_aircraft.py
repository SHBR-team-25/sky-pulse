import logging

from common.config import load_yt_config
from common.yt_client import make_client
from svc_bootstrap.csv_source import iter_csv_rows
from svc_bootstrap.schemas import REF_AIRCRAFT_FIELDS, REF_AIRCRAFT_SCHEMA
from svc_bootstrap.table_writer import create_table_safely

logger = logging.getLogger(__name__)

DEFAULT_SOURCE_URL = "https://opensky-network.org/datasets/metadata/aircraftDatabase.csv"


def _to_row(csv_row: dict[str, str]) -> dict[str, str | None]:
    return {field: csv_row.get(field) or None for field in REF_AIRCRAFT_FIELDS}


def load(source_url: str = DEFAULT_SOURCE_URL, overwrite: bool = False) -> None:
    config = load_yt_config()
    client = make_client(config)
    table_path = f"{config.base_path}/ref_aircraft"

    create_table_safely(client, table_path, REF_AIRCRAFT_SCHEMA, overwrite)

    rows = (_to_row(row) for row in iter_csv_rows(source_url))
    client.write_table(table_path, rows)
    logger.info("ref_aircraft loaded into %s", table_path)
