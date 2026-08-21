from collections.abc import Mapping
from dataclasses import dataclass
from typing import Any

import requests

from ingest_service.auth import TokenCache
from ingest_service.config import BoundingBox

_RATE_LIMIT_REMAINING_HEADER = "X-Rate-Limit-Remaining"
_RETRY_AFTER_HEADER = "Retry-After"
_TOO_MANY_REQUESTS = 429


class RateLimitExceededError(RuntimeError):
    """OpenSky ответил 429.

    Заполненный `retry_after` означает короткий троттлинг, а не исчерпанный
    суточный лимит — уходить в сон до полуночи UTC в этом случае нельзя.
    """

    def __init__(self, message: str, retry_after: float | None = None) -> None:
        super().__init__(message)
        self.retry_after = retry_after


@dataclass(frozen=True)
class StatesResponse:
    payload: dict[str, Any]
    # None — заголовка не было, значит полагаемся на локальный счётчик.
    credits_remaining: int | None


def fetch_states(
    bbox: BoundingBox | None, token_cache: TokenCache, states_url: str
) -> StatesResponse:
    params: dict[str, float | str] = {"extended": "1"}
    if bbox is not None:
        params["lamin"] = bbox.lamin
        params["lomin"] = bbox.lomin
        params["lamax"] = bbox.lamax
        params["lomax"] = bbox.lomax

    response = requests.get(
        states_url,
        params=params,
        headers={"Authorization": f"Bearer {token_cache.get_token()}"},
        timeout=30,
    )
    if response.status_code == _TOO_MANY_REQUESTS:
        raise RateLimitExceededError(
            f"OpenSky rejected the request: {response.text[:200]}",
            retry_after=_parse_retry_after(response.headers),
        )
    response.raise_for_status()

    result: dict[str, Any] = response.json()
    return StatesResponse(payload=result, credits_remaining=_parse_remaining(response.headers))


def _parse_remaining(headers: Mapping[str, str]) -> int | None:
    raw = headers.get(_RATE_LIMIT_REMAINING_HEADER)
    if raw is None:
        return None
    try:
        return int(raw)
    except ValueError:
        return None


def _parse_retry_after(headers: Mapping[str, str]) -> float | None:
    # Retry-After умеет быть и HTTP-датой; её не разбираем, вернём None и
    # уйдём в сон до сброса суточного лимита.
    raw = headers.get(_RETRY_AFTER_HEADER)
    if raw is None:
        return None
    try:
        return max(0.0, float(raw))
    except ValueError:
        return None
