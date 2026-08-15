import logging

from bootstrap_service.schemas import POSITIONS_HISTORY_SCHEMA
from bootstrap_service.table_writer import ensure_table
from common.config import load_yt_config
from common.yt_client import make_client

logger = logging.getLogger(__name__)


def load(overwrite: bool = False) -> None:
    config = load_yt_config()
    client = make_client(config)
    table_path = f"{config.base_path}/positions_history"

    if not ensure_table(client, table_path, POSITIONS_HISTORY_SCHEMA, overwrite, dynamic=True):
        logger.info("positions_history already exists at %s, skipping", table_path)
        return

    client.mount_table(table_path, sync=True)
    logger.info("positions_history created and mounted at %s", table_path)