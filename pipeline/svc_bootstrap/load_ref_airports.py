import logging

from common.config import load_yt_config
from common.yt_client import make_client
from svc_bootstrap.csv_source import iter_csv_rows
from svc_bootstrap.schemas import REF_AIRPORTS_FIELDS, REF_AIRPORTS_SCHEMA
from svc_bootstrap.table_writer import create_table_safely

logger = logging.getLogger(__name__)

DEFAULT_SOURCE_URL = "https://davidmegginson.github.io/ourairports-data/airports.csv"

_FLOAT_FIELDS = {"latitude_deg", "longitude_deg"}


def _to_row(csv_row: dict[str, str]) -> dict[str, str | float | None]:
    row: dict[str, str | float | None] = {}
    for field in REF_AIRPORTS_FIELDS:
        value = csv_row.get(field)
        row[field] = float(value) if field in _FLOAT_FIELDS and value else value or None
    return row


def load(source_url: str = DEFAULT_SOURCE_URL, overwrite: bool = False) -> None:
    config = load_yt_config()
    client = make_client(config)
    table_path = f"{config.base_path}/ref_airports"

    create_table_safely(client, table_path, REF_AIRPORTS_SCHEMA, overwrite)

    rows = (_to_row(row) for row in iter_csv_rows(source_url))
    client.write_table(table_path, rows)
    logger.info("ref_airports loaded into %s", table_path)
