import logging
import time
from typing import Any

import yt.wrapper as yt

logger = logging.getLogger(__name__)

STATUS_OK = "ok"
STATUS_OPENSKY_UNREACHABLE = "opensky_unreachable"
STATUS_RATE_LIMITED = "rate_limited"
STATUS_BUDGET_EXHAUSTED = "budget_exhausted"
STATUS_POLL_FAILED = "poll_failed"

_SERVICE = "ingest"


class HeartbeatWriter:
    """Пишет состояние опроса, чтобы бэкенд мог объяснить пустую карту.

    Пустой ответ неотличим от честно пустого bbox, поэтому «пайплайн стоит»
    нужно сообщать отдельным сигналом.
    """

    def __init__(self, client: yt.YtClient, table_path: str) -> None:
        self._client = client
        self._table_path = table_path
        self._last_success_at: int | None = None

    def success(self, credits_remaining: int) -> None:
        self._last_success_at = int(time.time())
        self._write(STATUS_OK, credits_remaining, resumes_at=None)

    def paused(self, status: str, credits_remaining: int, resumes_in: float | None) -> None:
        resumes_at = None if resumes_in is None else int(time.time() + resumes_in)
        self._write(status, credits_remaining, resumes_at)

    def _write(self, status: str, credits_remaining: int, resumes_at: int | None) -> None:
        row: dict[str, Any] = {
            "service": _SERVICE,
            "status": status,
            "updated_at": int(time.time()),
            "last_success_at": self._last_success_at,
            "resumes_at": resumes_at,
            "credits_remaining": credits_remaining,
        }
        try:
            self._client.insert_rows(self._table_path, [row])
        except Exception:
            # Хартбит — диагностика, а не данные: он не должен ломать опрос.
            logger.exception("failed to write heartbeat, continuing")
