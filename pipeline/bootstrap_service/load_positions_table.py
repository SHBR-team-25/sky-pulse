import logging

from bootstrap_service.schemas import POSITIONS_RAW_SCHEMA
from bootstrap_service.table_writer import ensure_table
from common.config import load_yt_config
from common.paths import table_path as resolve_table_path
from common.yt_client import make_client

logger = logging.getLogger(__name__)


def load(overwrite: bool = False) -> None:
    config = load_yt_config()
    client = make_client(config)
    table_path = resolve_table_path(config.base_path, "positions_raw")

    if not ensure_table(
        client, table_path, POSITIONS_RAW_SCHEMA, overwrite, dynamic=True,
        auto_trim_config={
            "enable": True,
            "retained_lifetime_duration": config.queue_retained_lifetime_seconds * 1000,
        },
    ):
        logger.info("positions_raw already exists at %s, skipping", table_path)
        return

    client.mount_table(table_path, sync=True)
    logger.info("positions_raw created and mounted at %s", table_path)
