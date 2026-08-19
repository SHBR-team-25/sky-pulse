import os
from dataclasses import dataclass


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
    bbox: BoundingBox
    poll_interval_seconds: int
    token_url: str
    states_url: str


_DEFAULT_LAMIN = 45.0
_DEFAULT_LOMIN = 5.0
_DEFAULT_LAMAX = 55.0
_DEFAULT_LOMAX = 25.0

_DEFAULT_TOKEN_URL = (
    "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token"
)
_DEFAULT_STATES_URL = "https://opensky-network.org/api/states/all"


def load_ingest_config() -> IngestConfig:
    return IngestConfig(
        opensky_client_id=os.environ["OPENSKY_CLIENT_ID"],
        opensky_client_secret=os.environ["OPENSKY_CLIENT_SECRET"],
        bbox=BoundingBox(
            lamin=float(os.environ.get("OPENSKY_BBOX_LAMIN", _DEFAULT_LAMIN)),
            lomin=float(os.environ.get("OPENSKY_BBOX_LOMIN", _DEFAULT_LOMIN)),
            lamax=float(os.environ.get("OPENSKY_BBOX_LAMAX", _DEFAULT_LAMAX)),
            lomax=float(os.environ.get("OPENSKY_BBOX_LOMAX", _DEFAULT_LOMAX)),
        ),
        poll_interval_seconds=int(os.environ.get("OPENSKY_POLL_INTERVAL_SECONDS", 10)),
        token_url=os.environ.get("OPENSKY_TOKEN_URL", _DEFAULT_TOKEN_URL),
        states_url=os.environ.get("OPENSKY_STATES_URL", _DEFAULT_STATES_URL),
    )
