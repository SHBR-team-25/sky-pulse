import logging

from bootstrap_service.schemas import DASHBOARD_TOTALS_SCHEMA
from bootstrap_service.table_writer import ensure_table
from common.config import load_yt_config
from common.yt_client import make_client

logger = logging.getLogger(__name__)


def load(overwrite: bool = False) -> None:
    config = load_yt_config()
    client = make_client(config)
    table_path = f"{config.base_path}/dashboard_totals"

    if not ensure_table(client, table_path, DASHBOARD_TOTALS_SCHEMA, overwrite):
        logger.info("dashboard_totals already exists at %s, skipping", table_path)
        return

    logger.info("dashboard_totals created at %s", table_path)
