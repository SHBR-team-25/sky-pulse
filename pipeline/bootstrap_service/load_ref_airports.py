import logging

from bootstrap_service.csv_source import iter_csv_rows
from bootstrap_service.schemas import REF_AIRPORTS_FIELDS, REF_AIRPORTS_SCHEMA
from bootstrap_service.table_writer import ensure_table
from common.config import load_yt_config
from common.paths import table_path as resolve_table_path
from common.yt_client import make_client

logger = logging.getLogger(__name__)

DEFAULT_SOURCE_URL = "https://davidmegginson.github.io/ourairports-data/airports.csv"

_FLOAT_FIELDS = {"latitude_deg", "longitude_deg"}
_REQUIRED_FIELDS = ("ident", "name", "type", "latitude_deg", "longitude_deg")


def _to_row(csv_row: dict[str, str]) -> dict[str, str | float | None]:
    row: dict[str, str | float | None] = {}
    for field in REF_AIRPORTS_FIELDS:
        value = csv_row.get(field)
        row[field] = float(value) if field in _FLOAT_FIELDS and value else value or None
    return row


def load(source_url: str = DEFAULT_SOURCE_URL, overwrite: bool = False) -> None:
    config = load_yt_config()
    client = make_client(config)
    table_path = resolve_table_path(config.base_path, "ref_airports")

    if not ensure_table(client, table_path, REF_AIRPORTS_SCHEMA, overwrite):
        logger.info("ref_airports already exists at %s, skipping", table_path)
        return

    rows = (_to_row(row) for row in iter_csv_rows(source_url))
    rows = (row for row in rows if all(row[field] is not None for field in _REQUIRED_FIELDS))
    client.write_table(table_path, rows)
    logger.info("ref_airports loaded into %s", table_path)
