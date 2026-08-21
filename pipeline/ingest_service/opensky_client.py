from dataclasses import dataclass
from typing import Any

import requests

from ingest_service.auth import TokenCache
from ingest_service.config import BoundingBox


@dataclass(frozen=True)
class StatesResponse:
    payload: dict[str, Any]
    credits_remaining: int | None


class RateLimitExceeded(Exception):
    def __init__(self, retry_after_seconds: float | None) -> None:
        super().__init__("OpenSky API credit limit exceeded")
        self.retry_after_seconds = retry_after_seconds


def _parse_non_negative_int(value: str | None) -> int | None:
    if value is None:
        return None
    try:
        parsed = int(value)
    except ValueError:
        return None
    return max(0, parsed)


def _parse_non_negative_float(value: str | None) -> float | None:
    if value is None:
        return None
    try:
        parsed = float(value)
    except ValueError:
        return None
    return max(0.0, parsed)


def fetch_states(
    bbox: BoundingBox | None, token_cache: TokenCache, states_url: str
) -> StatesResponse:
    params: dict[str, float | str] = {"extended": "1"}
    if bbox is not None:
        params.update(
            lamin=bbox.lamin,
            lomin=bbox.lomin,
            lamax=bbox.lamax,
            lomax=bbox.lomax,
        )
    response = requests.get(
        states_url,
        params=params,
        headers={"Authorization": f"Bearer {token_cache.get_token()}"},
        timeout=30,
    )
    if response.status_code == 429:
        raise RateLimitExceeded(
            _parse_non_negative_float(response.headers.get("X-Rate-Limit-Retry-After-Seconds"))
        )
    response.raise_for_status()
    result: dict[str, Any] = response.json()
    return StatesResponse(
        payload=result,
        credits_remaining=_parse_non_negative_int(
            response.headers.get("X-Rate-Limit-Remaining")
        ),
    )
