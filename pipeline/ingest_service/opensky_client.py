from typing import Any

import requests

from ingest_service.auth import TokenCache
from ingest_service.config import BoundingBox


def fetch_states(bbox: BoundingBox, token_cache: TokenCache, states_url: str) -> dict[str, Any]:
    params: dict[str, float | str] = {
        "lamin": bbox.lamin,
        "lomin": bbox.lomin,
        "lamax": bbox.lamax,
        "lomax": bbox.lomax,
        "extended": "1",
    }
    response = requests.get(
        states_url,
        params=params,
        headers={"Authorization": f"Bearer {token_cache.get_token()}"},
        timeout=30,
    )
    response.raise_for_status()
    result: dict[str, Any] = response.json()
    return result
