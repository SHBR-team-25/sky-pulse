import logging
import time
from typing import Any

import requests

from common.config import load_yt_config
from common.yt_client import make_client
from ingest_service.auth import TokenCache
from ingest_service.config import IngestConfig, load_ingest_config, request_cost
from ingest_service.heartbeat import (
    STATUS_BUDGET_EXHAUSTED,
    STATUS_OPENSKY_UNREACHABLE,
    STATUS_POLL_FAILED,
    STATUS_RATE_LIMITED,
    HeartbeatWriter,
)
from ingest_service.opensky_client import RateLimitExceededError, fetch_states
from ingest_service.parsing import to_positions_raw_rows
from ingest_service.rate_limiter import DailyCreditBudget
from ingest_service.writer import write_rows

logger = logging.getLogger(__name__)

_SECONDS_PER_HOUR = 3600
_MAX_BACKOFF_SECONDS = 300.0


def _log_budget_forecast(config: IngestConfig, cost: int) -> None:
    # Бюджет — стоп-кран, а не планировщик частоты, и штатно останавливает опрос
    # посреди суток. Без этого лога пауза выглядит как зависший сервис.
    area = "whole world" if config.bbox is None else str(config.bbox)
    requests_per_day = config.daily_credit_budget // cost
    hours = requests_per_day * config.poll_interval_seconds / _SECONDS_PER_HOUR
    logger.info(
        "polling %s every %ds at %d credit(s) per request; "
        "budget of %d credits covers ~%d requests (~%.1fh per day)",
        area,
        config.poll_interval_seconds,
        cost,
        config.daily_credit_budget,
        requests_per_day,
        hours,
    )


def _backoff_seconds(consecutive_failures: int, poll_interval_seconds: int) -> float:
    return min(poll_interval_seconds * 2.0 ** (consecutive_failures - 1), _MAX_BACKOFF_SECONDS)


def _wait_until_table_ready(client: Any, table_path: str, poll_interval_seconds: int) -> bool:
    """Дожидается доступности YT. False — таблицы нет, это ошибка развёртывания.

    Недоступность YT на старте не должна ронять процесс (NFR5): ingest вполне
    может подняться раньше кластера.
    """
    consecutive_failures = 0
    while True:
        try:
            if client.exists(table_path):
                return True
            logger.error("Table %s does not exist, run bootstrap first", table_path)
            return False
        except Exception:
            consecutive_failures += 1
            delay = _backoff_seconds(consecutive_failures, poll_interval_seconds)
            logger.exception("YT is unreachable, retrying in %.0fs", delay)
            time.sleep(delay)


def run() -> None:
    yt_config = load_yt_config()
    ingest_config = load_ingest_config()

    client = make_client(yt_config)
    table_path = f"{yt_config.base_path}/positions_raw"

    if not _wait_until_table_ready(client, table_path, ingest_config.poll_interval_seconds):
        return

    token_cache = TokenCache(
        ingest_config.opensky_client_id,
        ingest_config.opensky_client_secret,
        ingest_config.token_url,
    )
    budget = DailyCreditBudget(ingest_config.daily_credit_budget)
    cost = request_cost(ingest_config.bbox)
    heartbeat = HeartbeatWriter(client, f"{yt_config.base_path}/ingest_heartbeat")
    _log_budget_forecast(ingest_config, cost)

    consecutive_failures = 0
    while True:
        if not budget.try_consume(cost):
            wait = budget.seconds_until_reset()
            logger.info("daily credit budget exhausted, sleeping %.0fs until UTC midnight", wait)
            heartbeat.paused(STATUS_BUDGET_EXHAUSTED, budget.remaining(), wait)
            time.sleep(wait)
            continue

        try:
            response = fetch_states(ingest_config.bbox, token_cache, ingest_config.states_url)
            if response.credits_remaining is not None:
                budget.sync_remaining(response.credits_remaining)

            rows = to_positions_raw_rows(response.payload)
            write_rows(client, table_path, rows)
            consecutive_failures = 0
            heartbeat.success(budget.remaining())
            logger.info(
                "wrote %d rows to %s, ~%d credits left",
                len(rows),
                table_path,
                budget.remaining(),
            )
        except RateLimitExceededError as error:
            _sleep_after_rate_limit(error, budget, heartbeat)
            continue
        except (requests.ConnectionError, requests.Timeout):
            # Запрос не дошёл до OpenSky, кредит за него не списан.
            budget.refund(cost)
            consecutive_failures += 1
            delay = _backoff_seconds(consecutive_failures, ingest_config.poll_interval_seconds)
            logger.warning(
                "OpenSky is unreachable (attempt %d), retrying in %.0fs",
                consecutive_failures,
                delay,
            )
            heartbeat.paused(STATUS_OPENSKY_UNREACHABLE, budget.remaining(), delay)
            time.sleep(delay)
            continue
        except Exception:
            # Снапшот теряем: следующий опрос всё равно принесёт свежие позиции.
            consecutive_failures += 1
            delay = _backoff_seconds(consecutive_failures, ingest_config.poll_interval_seconds)
            logger.exception("poll failed, snapshot dropped, retrying in %.0fs", delay)
            heartbeat.paused(STATUS_POLL_FAILED, budget.remaining(), delay)
            time.sleep(delay)
            continue

        time.sleep(ingest_config.poll_interval_seconds)


def _sleep_after_rate_limit(
    error: RateLimitExceededError, budget: DailyCreditBudget, heartbeat: HeartbeatWriter
) -> None:
    if error.retry_after is not None:
        logger.warning("OpenSky returned 429, retrying in %.0fs", error.retry_after)
        heartbeat.paused(STATUS_RATE_LIMITED, budget.remaining(), error.retry_after)
        time.sleep(error.retry_after)
        return

    # Локальный счётчик считал, что кредиты есть, а сервер отказал — верим серверу.
    budget.exhaust()
    wait = budget.seconds_until_reset()
    logger.warning("OpenSky returned 429, sleeping %.0fs until UTC midnight", wait)
    heartbeat.paused(STATUS_BUDGET_EXHAUSTED, budget.remaining(), wait)
    time.sleep(wait)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run()
