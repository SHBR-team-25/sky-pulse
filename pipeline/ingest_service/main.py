import logging
import time

from common.config import load_yt_config
from common.paths import table_path
from common.yt_client import make_client
from ingest_service.auth import TokenCache
from ingest_service.config import load_ingest_config
from ingest_service.opensky_client import RateLimitExceeded, fetch_states
from ingest_service.parsing import summarize_state_categories, to_positions_raw_rows
from ingest_service.writer import write_rows

logger = logging.getLogger(__name__)


def run() -> None:
    yt_config = load_yt_config()
    ingest_config = load_ingest_config()

    client = make_client(yt_config)
    positions_raw_path = table_path(yt_config.base_path, "positions_raw")

    if not client.exists(positions_raw_path):
        logger.error("Table %s does not exist, run bootstrap first", positions_raw_path)
        return

    token_cache = TokenCache(
        ingest_config.opensky_client_id,
        ingest_config.opensky_client_secret,
        ingest_config.token_url,
    )
    while True:
        try:
            response = fetch_states(ingest_config.bbox, token_cache, ingest_config.states_url)
            source_row_count = len(response.payload.get("states") or [])
            logger.info(
                "OpenSky category distribution: %s",
                summarize_state_categories(response.payload),
            )
            rows = to_positions_raw_rows(response.payload)
            write_rows(client, positions_raw_path, rows)
            logger.info(
                "wrote %d of %d OpenSky rows to %s after aircraft filtering; "
                "OpenSky credits remaining: %s",
                len(rows),
                source_row_count,
                positions_raw_path,
                response.credits_remaining if response.credits_remaining is not None else "unknown",
            )
        except RateLimitExceeded as error:
            wait = (
                error.retry_after_seconds
                if error.retry_after_seconds is not None
                else ingest_config.poll_interval_seconds
            )
            wait = max(1.0, wait)
            logger.warning("OpenSky credits exhausted, sleeping %.0fs", wait)
            time.sleep(wait)
            continue
        except Exception:
            logger.exception("poll failed, will retry after interval")

        time.sleep(ingest_config.poll_interval_seconds)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run()
