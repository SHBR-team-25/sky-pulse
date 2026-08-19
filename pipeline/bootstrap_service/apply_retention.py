"""Однократно применяет retention к уже существующим таблицам YTsaurus."""

import logging

from common.config import load_yt_config
from common.yt_client import make_client

logger = logging.getLogger(__name__)

TTL_TABLES = (
    "positions_history",
    "flights_segments",
    "airport_events",
    "dashboard_trend",
)


def apply() -> None:
    config = load_yt_config()
    client = make_client(config)

    for table_name in TTL_TABLES:
        path = f"{config.base_path}/{table_name}"
        if not client.exists(path):
            logger.warning("Table does not exist, skipping: %s", path)
            continue
        client.unmount_table(path, sync=True)
        try:
            client.set(f"{path}/@max_data_ttl", config.data_retention_seconds * 1000)
            client.set(f"{path}/@min_data_versions", 0)
        finally:
            client.mount_table(path, sync=True)
        logger.info("Retention applied to %s", path)

    queue_path = f"{config.base_path}/positions_raw"
    if client.exists(queue_path):
        client.set(
            f"{queue_path}/@auto_trim_config",
            {
                "enable": True,
                "retained_lifetime_duration": config.queue_retained_lifetime_seconds * 1000,
            },
        )
        logger.info("Queue auto-trim applied to %s", queue_path)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    apply()
