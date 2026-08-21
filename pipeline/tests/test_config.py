import pytest

from ingest_service.config import BoundingBox, load_ingest_config, request_cost

_REQUIRED_ENV = {
    "OPENSKY_CLIENT_ID": "id",
    "OPENSKY_CLIENT_SECRET": "secret",
}


def _bbox(lat_span: float, lon_span: float) -> BoundingBox:
    return BoundingBox(lamin=0.0, lomin=0.0, lamax=lat_span, lomax=lon_span)


def test_no_bbox_costs_the_global_tariff() -> None:
    assert request_cost(None) == 4


@pytest.mark.parametrize(
    ("lat_span", "lon_span", "expected"),
    [
        (5.0, 5.0, 1),  # ровно 25 кв. градусов — верхняя граница первого тарифа
        (5.0, 5.1, 2),  # чуть больше 25 — уже второй
        (10.0, 10.0, 2),  # ровно 100
        (10.0, 10.1, 3),
        (20.0, 20.0, 3),  # ровно 400
        (20.0, 20.1, 4),  # больше 400 — тариф как у глобального запроса
        (10.0, 20.0, 3),  # bbox Центральной Европы, который был дефолтом
    ],
)
def test_request_cost_by_area(lat_span: float, lon_span: float, expected: int) -> None:
    assert request_cost(_bbox(lat_span, lon_span)) == expected


def test_bbox_is_none_when_env_is_empty(monkeypatch: pytest.MonkeyPatch) -> None:
    for name, value in _REQUIRED_ENV.items():
        monkeypatch.setenv(name, value)
    for corner in ("LAMIN", "LOMIN", "LAMAX", "LOMAX"):
        monkeypatch.delenv(f"OPENSKY_BBOX_{corner}", raising=False)

    assert load_ingest_config().bbox is None


def test_partial_bbox_falls_back_to_global(monkeypatch: pytest.MonkeyPatch) -> None:
    for name, value in _REQUIRED_ENV.items():
        monkeypatch.setenv(name, value)
    monkeypatch.setenv("OPENSKY_BBOX_LAMIN", "45.0")
    monkeypatch.setenv("OPENSKY_BBOX_LOMIN", "5.0")
    for corner in ("LAMAX", "LOMAX"):
        monkeypatch.delenv(f"OPENSKY_BBOX_{corner}", raising=False)

    assert load_ingest_config().bbox is None


def test_full_bbox_is_loaded(monkeypatch: pytest.MonkeyPatch) -> None:
    for name, value in _REQUIRED_ENV.items():
        monkeypatch.setenv(name, value)
    monkeypatch.setenv("OPENSKY_BBOX_LAMIN", "45.0")
    monkeypatch.setenv("OPENSKY_BBOX_LOMIN", "5.0")
    monkeypatch.setenv("OPENSKY_BBOX_LAMAX", "55.0")
    monkeypatch.setenv("OPENSKY_BBOX_LOMAX", "25.0")

    assert load_ingest_config().bbox == BoundingBox(45.0, 5.0, 55.0, 25.0)


def test_poll_interval_defaults_to_15_seconds(monkeypatch: pytest.MonkeyPatch) -> None:
    for name, value in _REQUIRED_ENV.items():
        monkeypatch.setenv(name, value)
    monkeypatch.delenv("OPENSKY_POLL_INTERVAL_SECONDS", raising=False)

    assert load_ingest_config().poll_interval_seconds == 15
