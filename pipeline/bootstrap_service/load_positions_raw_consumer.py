import logging

from bootstrap_service.schemas import CONSUMER_SCHEMA
from bootstrap_service.table_writer import ensure_consumer_registration, ensure_table
from common.config import load_yt_config
from common.paths import table_path
from common.yt_client import make_client

logger = logging.getLogger(__name__)


def load(overwrite: bool = False) -> None:
    config = load_yt_config()
    client = make_client(config)
    consumer_path = table_path(config.base_path, "positions_raw_consumer")
    queue_path = table_path(config.base_path, "positions_raw")

    if not ensure_table(
        client,
        consumer_path,
        schema=CONSUMER_SCHEMA,
        overwrite=overwrite,
        dynamic=True,
        is_consumer=True,
    ):
        logger.info("positions_raw_consumer already exists at %s", consumer_path)
    logger.info("positions_raw_consumer created at %s", consumer_path)

    if not ensure_consumer_registration(
        client,
        queue_path=queue_path,
        consumer_path=consumer_path,
        vital=True,
    ):
        logger.info("positions_raw_consumer already registered for %s", queue_path)
    logger.info("positions_raw_consumer registered successfully")

    client.mount_table(consumer_path, sync=True)
    logger.info("positions_raw_consumer mounted at %s", consumer_path)
