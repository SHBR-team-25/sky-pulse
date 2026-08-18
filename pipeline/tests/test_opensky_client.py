from typing import Any, cast

import pytest
import requests

from ingest_service.auth import TokenCache
from ingest_service.config import BoundingBox
from ingest_service.opensky_client import RateLimitExceededError, fetch_states

_EMPTY_SNAPSHOT = {"time": 1, "states": []}


class _FakeResponse:
    def __init__(
        self,
        status_code: int = 200,
        payload: dict[str, Any] | None = None,
        headers: dict[str, str] | None = None,
    ) -> None:
        self.status_code = status_code
        self.headers = headers or {}
        self.text = ""
        self._payload = payload or {}

    def json(self) -> dict[str, Any]:
        return self._payload

    def raise_for_status(self) -> None:
        if self.status_code >= 400:
            raise AssertionError(f"unexpected status {self.status_code}")


class _StubTokenCache:
    def get_token(self) -> str:
        return "stub-token"


def _token_cache() -> TokenCache:
    return cast(TokenCache, _StubTokenCache())


def _patch_get(
    monkeypatch: pytest.MonkeyPatch, response: _FakeResponse
) -> dict[str, dict[str, Any]]:
    captured: dict[str, dict[str, Any]] = {}

    def fake_get(url: str, **kwargs: Any) -> _FakeResponse:
        captured["params"] = kwargs["params"]
        return response

    # opensky_client делает `import requests`, поэтому патч самого модуля виден и ему.
    monkeypatch.setattr(requests, "get", fake_get)
    return captured


def test_global_poll_sends_no_bbox_params(monkeypatch: pytest.MonkeyPatch) -> None:
    captured = _patch_get(monkeypatch, _FakeResponse(payload=_EMPTY_SNAPSHOT))

    fetch_states(None, _token_cache(), "https://opensky.test/states/all")

    assert captured["params"] == {"extended": "1"}


def test_bbox_poll_sends_all_four_corners(monkeypatch: pytest.MonkeyPatch) -> None:
    captured = _patch_get(monkeypatch, _FakeResponse(payload=_EMPTY_SNAPSHOT))

    fetch_states(
        BoundingBox(45.0, 5.0, 55.0, 25.0), _token_cache(), "https://opensky.test/states/all"
    )

    assert captured["params"] == {
        "extended": "1",
        "lamin": 45.0,
        "lomin": 5.0,
        "lamax": 55.0,
        "lomax": 25.0,
    }


def test_reads_remaining_credits_from_header(monkeypatch: pytest.MonkeyPatch) -> None:
    _patch_get(
        monkeypatch,
        _FakeResponse(payload=_EMPTY_SNAPSHOT, headers={"X-Rate-Limit-Remaining": "3996"}),
    )

    result = fetch_states(None, _token_cache(), "https://opensky.test/states/all")

    assert result.credits_remaining == 3996
    assert result.payload == _EMPTY_SNAPSHOT


def test_missing_header_leaves_credits_unknown(monkeypatch: pytest.MonkeyPatch) -> None:
    _patch_get(monkeypatch, _FakeResponse(payload=_EMPTY_SNAPSHOT))

    assert fetch_states(None, _token_cache(), "https://opensky.test/states/all") \
        .credits_remaining is None


def test_unparsable_header_leaves_credits_unknown(monkeypatch: pytest.MonkeyPatch) -> None:
    _patch_get(
        monkeypatch,
        _FakeResponse(payload=_EMPTY_SNAPSHOT, headers={"X-Rate-Limit-Remaining": "n/a"}),
    )

    assert fetch_states(None, _token_cache(), "https://opensky.test/states/all") \
        .credits_remaining is None


def test_429_raises_a_dedicated_error(monkeypatch: pytest.MonkeyPatch) -> None:
    _patch_get(monkeypatch, _FakeResponse(status_code=429))

    with pytest.raises(RateLimitExceededError) as raised:
        fetch_states(None, _token_cache(), "https://opensky.test/states/all")

    # Без Retry-After считаем, что исчерпан суточный лимит.
    assert raised.value.retry_after is None


def test_429_carries_retry_after_when_server_sent_it(monkeypatch: pytest.MonkeyPatch) -> None:
    _patch_get(monkeypatch, _FakeResponse(status_code=429, headers={"Retry-After": "30"}))

    with pytest.raises(RateLimitExceededError) as raised:
        fetch_states(None, _token_cache(), "https://opensky.test/states/all")

    assert raised.value.retry_after == 30.0


def test_429_with_unparsable_retry_after_falls_back_to_daily_reset(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    # HTTP-дату в Retry-After не разбираем — лучше проспать до сброса лимита,
    # чем сделать вид, что ждать не нужно.
    _patch_get(
        monkeypatch,
        _FakeResponse(status_code=429, headers={"Retry-After": "Wed, 21 Oct 2026 07:28:00 GMT"}),
    )

    with pytest.raises(RateLimitExceededError) as raised:
        fetch_states(None, _token_cache(), "https://opensky.test/states/all")

    assert raised.value.retry_after is None
