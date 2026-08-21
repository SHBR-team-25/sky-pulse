from unittest.mock import Mock

import pytest

from ingest_service.config import BoundingBox, load_ingest_config
from ingest_service.opensky_client import RateLimitExceeded, fetch_states


def _bbox() -> BoundingBox:
    return BoundingBox(lamin=45.0, lomin=5.0, lamax=55.0, lomax=25.0)


def test_fetch_states_returns_server_credit_balance(monkeypatch):
    response = Mock(status_code=200, headers={"X-Rate-Limit-Remaining": "3997"})
    response.json.return_value = {"time": 123, "states": []}
    monkeypatch.setattr("ingest_service.opensky_client.requests.get", lambda *args, **kwargs: response)
    token_cache = Mock()
    token_cache.get_token.return_value = "token"

    result = fetch_states(_bbox(), token_cache, "https://example.test/states/all")

    assert result.payload == {"time": 123, "states": []}
    assert result.credits_remaining == 3997
    response.raise_for_status.assert_called_once_with()


def test_fetch_states_without_bbox_requests_all_states(monkeypatch):
    response = Mock(status_code=200, headers={})
    response.json.return_value = {"time": 123, "states": []}
    get = Mock(return_value=response)
    monkeypatch.setattr("ingest_service.opensky_client.requests.get", get)

    fetch_states(None, Mock(get_token=Mock(return_value="token")), "states-url")

    assert get.call_args.kwargs["params"] == {"extended": "1"}


def test_config_all_scope_disables_bbox(monkeypatch):
    monkeypatch.setenv("OPENSKY_CLIENT_ID", "client")
    monkeypatch.setenv("OPENSKY_CLIENT_SECRET", "secret")
    monkeypatch.setenv("OPENSKY_SCOPE", "ALL")

    assert load_ingest_config().bbox is None


def test_config_rejects_unknown_scope(monkeypatch):
    monkeypatch.setenv("OPENSKY_SCOPE", "world")

    with pytest.raises(ValueError, match="OPENSKY_SCOPE"):
        load_ingest_config()


def test_fetch_states_allows_missing_credit_header(monkeypatch):
    response = Mock(status_code=200, headers={})
    response.json.return_value = {"time": 123, "states": []}
    monkeypatch.setattr("ingest_service.opensky_client.requests.get", lambda *args, **kwargs: response)

    result = fetch_states(_bbox(), Mock(get_token=Mock(return_value="token")), "unused")

    assert result.credits_remaining is None


def test_fetch_states_raises_rate_limit_with_server_wait(monkeypatch):
    response = Mock(
        status_code=429,
        headers={"X-Rate-Limit-Retry-After-Seconds": "321.5"},
    )
    monkeypatch.setattr("ingest_service.opensky_client.requests.get", lambda *args, **kwargs: response)

    with pytest.raises(RateLimitExceeded) as caught:
        fetch_states(_bbox(), Mock(get_token=Mock(return_value="token")), "unused")

    assert caught.value.retry_after_seconds == 321.5
    response.raise_for_status.assert_not_called()


def test_fetch_states_ignores_malformed_rate_limit_headers(monkeypatch):
    response = Mock(
        status_code=429,
        headers={"X-Rate-Limit-Retry-After-Seconds": "not-a-number"},
    )
    monkeypatch.setattr("ingest_service.opensky_client.requests.get", lambda *args, **kwargs: response)

    with pytest.raises(RateLimitExceeded) as caught:
        fetch_states(_bbox(), Mock(get_token=Mock(return_value="token")), "unused")

    assert caught.value.retry_after_seconds is None
