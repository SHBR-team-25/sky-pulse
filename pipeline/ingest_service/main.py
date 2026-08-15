import logging
import time

from common.config import load_yt_config
from common.yt_client import make_client
from ingest_service.auth import TokenCache
from ingest_service.config import load_ingest_config
from ingest_service.opensky_client import fetch_states
from ingest_service.parsing import to_positions_raw_rows
from ingest_service.rate_limiter import DailyRequestBudget
from ingest_service.writer import write_rows

logger = logging.getLogger(__name__)


def run() -> None:
    yt_config = load_yt_config()
    ingest_config = load_ingest_config()

    client = make_client(yt_config)
    table_path = f"{yt_config.base_path}/positions_raw"

    token_cache = TokenCache(
        ingest_config.opensky_client_id,
        ingest_config.opensky_client_secret,
        ingest_config.token_url,
    )
    budget = DailyRequestBudget(ingest_config.daily_request_budget)

    while True:
        if not budget.try_consume():
            wait = budget.seconds_until_reset()
            logger.info("daily request budget exhausted, sleeping %.0fs", wait)
            time.sleep(wait)
            continue

        try:
            response = fetch_states(ingest_config.bbox, token_cache, ingest_config.states_url)
            rows = to_positions_raw_rows(response)
            write_rows(client, table_path, rows)
            logger.info("wrote %d rows to %s", len(rows), table_path)
        except Exception:
            logger.exception("poll failed, will retry after interval")

        time.sleep(ingest_config.poll_interval_seconds)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run()
