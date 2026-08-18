from typing import Any

import pytest

from ingest_service.main import _backoff_seconds, _wait_until_table_ready


class _UnreachableThenReadyClient:
    """YT отвечает ошибкой первые `failures` раз, потом поднимается."""

    def __init__(self, failures: int) -> None:
        self._failures = failures
        self.attempts = 0

    def exists(self, table_path: str) -> bool:
        self.attempts += 1
        if self.attempts <= self._failures:
            raise ConnectionError("YT is down")
        return True


class _MissingTableClient:
    def exists(self, table_path: str) -> bool:
        return False


@pytest.fixture(autouse=True)
def _no_real_sleep(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("ingest_service.main.time.sleep", lambda seconds: None)


def test_backoff_grows_exponentially() -> None:
    assert _backoff_seconds(1, 15) == 15
    assert _backoff_seconds(2, 15) == 30
    assert _backoff_seconds(3, 15) == 60


def test_backoff_is_capped() -> None:
    # Иначе после суток недоступности сервис проспал бы следующий рабочий день.
    assert _backoff_seconds(50, 15) == 300


def test_startup_waits_out_unreachable_yt_instead_of_crashing() -> None:
    client = _UnreachableThenReadyClient(failures=3)

    assert _wait_until_table_ready(client, "//tmp/positions_raw", 15) is True
    assert client.attempts == 4


def test_startup_gives_up_when_table_is_missing() -> None:
    # Таблицы нет — это не сбой связи, а незапущенный bootstrap; ждать бессмысленно.
    assert _wait_until_table_ready(_MissingTableClient(), "//tmp/positions_raw", 15) is False


def test_startup_survives_any_client_error(monkeypatch: pytest.MonkeyPatch) -> None:
    calls = {"n": 0}

    class _FlakyClient:
        def exists(self, table_path: str) -> Any:
            calls["n"] += 1
            if calls["n"] == 1:
                raise RuntimeError("proxy returned 503")
            return True

    assert _wait_until_table_ready(_FlakyClient(), "//tmp/positions_raw", 15) is True
