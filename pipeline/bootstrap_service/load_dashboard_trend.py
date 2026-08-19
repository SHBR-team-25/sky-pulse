import logging

from bootstrap_service.schemas import DASHBOARD_TREND_SCHEMA
from bootstrap_service.table_writer import ensure_table
from common.config import load_yt_config
from common.yt_client import make_client

logger = logging.getLogger(__name__)


def load(overwrite: bool = False) -> None:
    config = load_yt_config()
    client = make_client(config)
    table_path = f"{config.base_path}/dashboard_trend"

    if not ensure_table(
        client, table_path, DASHBOARD_TREND_SCHEMA, overwrite, dynamic=True,
        max_data_ttl_ms=config.data_retention_seconds * 1000,
    ):
        logger.info("dashboard_trend already exists at %s, skipping", table_path)
        return

    client.mount_table(table_path, sync=True)
    logger.info("dashboard_trend created and mounted at %s", table_path)
