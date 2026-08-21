import logging
import os
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class BoundingBox:
    lamin: float
    lomin: float
    lamax: float
    lomax: float


@dataclass(frozen=True)
class IngestConfig:
    opensky_client_id: str
    opensky_client_secret: str
    bbox: BoundingBox | None
    poll_interval_seconds: int
    daily_credit_budget: int
    token_url: str
    states_url: str


_DEFAULT_TOKEN_URL = (
    "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token"
)
_DEFAULT_STATES_URL = "https://opensky-network.org/api/states/all"

# Тарифная сетка OpenSky: цена запроса зависит от площади bbox в кв. градусах (FR7).
_GLOBAL_REQUEST_COST = 4
_COST_BY_MAX_AREA: tuple[tuple[float, int], ...] = ((25.0, 1), (100.0, 2), (400.0, 3))


def request_cost(bbox: BoundingBox | None) -> int:
    if bbox is None:
        return _GLOBAL_REQUEST_COST

    area = (bbox.lamax - bbox.lamin) * (bbox.lomax - bbox.lomin)
    for max_area, cost in _COST_BY_MAX_AREA:
        if area <= max_area:
            return cost
    return _GLOBAL_REQUEST_COST


def _load_bbox() -> BoundingBox | None:
    lamin = os.environ.get("OPENSKY_BBOX_LAMIN")
    lomin = os.environ.get("OPENSKY_BBOX_LOMIN")
    lamax = os.environ.get("OPENSKY_BBOX_LAMAX")
    lomax = os.environ.get("OPENSKY_BBOX_LOMAX")

    if lamin is None or lomin is None or lamax is None or lomax is None:
        # Половина bbox — почти наверняка опечатка, а уход на глобальный опрос
        # незаметно поднимает цену запроса до 4 кредитов.
        if any(value is not None for value in (lamin, lomin, lamax, lomax)):
            logger.warning(
                "OPENSKY_BBOX_* set only partially, all four are required — polling globally"
            )
        return None

    return BoundingBox(
        lamin=float(lamin),
        lomin=float(lomin),
        lamax=float(lamax),
        lomax=float(lomax),
    )


def load_ingest_config() -> IngestConfig:
    return IngestConfig(
        opensky_client_id=os.environ["OPENSKY_CLIENT_ID"],
        opensky_client_secret=os.environ["OPENSKY_CLIENT_SECRET"],
        bbox=_load_bbox(),
        poll_interval_seconds=int(os.environ.get("OPENSKY_POLL_INTERVAL_SECONDS", 15)),
        daily_credit_budget=int(os.environ.get("OPENSKY_DAILY_CREDIT_BUDGET", 4000)),
        token_url=os.environ.get("OPENSKY_TOKEN_URL", _DEFAULT_TOKEN_URL),
        states_url=os.environ.get("OPENSKY_STATES_URL", _DEFAULT_STATES_URL),
    )
