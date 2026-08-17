import logging

from bootstrap_service.schemas import PIPELINE_JOB_STATE_SCHEMA
from bootstrap_service.table_writer import ensure_table
from common.config import load_yt_config
from common.yt_client import make_client

logger = logging.getLogger(__name__)


def load(overwrite: bool = False) -> None:
    config = load_yt_config()
    client = make_client(config)
    table_path = f"{config.base_path}/pipeline_job_state"

    if not ensure_table(client, table_path, PIPELINE_JOB_STATE_SCHEMA, overwrite, dynamic=True):
        logger.info("pipeline_job_state already exists at %s, skipping", table_path)
        return

    client.mount_table(table_path, sync=True)
    logger.info("pipeline_job_state created and mounted at %s", table_path)
