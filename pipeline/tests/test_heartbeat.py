import time
from typing import Any, cast

import pytest
import yt.wrapper as yt

from ingest_service.heartbeat import (
    STATUS_BUDGET_EXHAUSTED,
    STATUS_OK,
    HeartbeatWriter,
)

_NOW = 1_700_000_000.0


class _FakeClient:
    def __init__(self) -> None:
        self.rows: list[dict[str, Any]] = []

    def insert_rows(self, table_path: str, rows: list[dict[str, Any]]) -> None:
        self.rows.extend(rows)


class _BrokenClient:
    def insert_rows(self, table_path: str, rows: list[dict[str, Any]]) -> None:
        raise ConnectionError("YT is down")


@pytest.fixture(autouse=True)
def _frozen_clock(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(time, "time", lambda: _NOW)


def _writer(client: object) -> tuple[HeartbeatWriter, Any]:
    return HeartbeatWriter(cast(yt.YtClient, client), "//tmp/ingest_heartbeat"), client


def test_success_records_the_moment_of_last_good_poll() -> None:
    writer, client = _writer(_FakeClient())

    writer.success(credits_remaining=3996)

    row = client.rows[-1]
    assert row["status"] == STATUS_OK
    assert row["last_success_at"] == int(_NOW)
    assert row["credits_remaining"] == 3996
    assert row["resumes_at"] is None


def test_pause_reports_when_polling_resumes() -> None:
    writer, client = _writer(_FakeClient())

    writer.paused(STATUS_BUDGET_EXHAUSTED, credits_remaining=0, resumes_in=7200)

    row = client.rows[-1]
    assert row["status"] == STATUS_BUDGET_EXHAUSTED
    assert row["resumes_at"] == int(_NOW) + 7200


def test_pause_keeps_the_earlier_success_timestamp() -> None:
    writer, client = _writer(_FakeClient())
    writer.success(credits_remaining=4)

    writer.paused(STATUS_BUDGET_EXHAUSTED, credits_remaining=0, resumes_in=7200)

    # Бэкенд считает stale именно по last_success_at — пауза не должна его обнулять.
    assert client.rows[-1]["last_success_at"] == int(_NOW)


def test_pause_before_any_success_leaves_last_success_null() -> None:
    writer, client = _writer(_FakeClient())

    writer.paused(STATUS_BUDGET_EXHAUSTED, credits_remaining=0, resumes_in=None)

    assert client.rows[-1]["last_success_at"] is None
    assert client.rows[-1]["resumes_at"] is None


def test_write_failure_never_breaks_the_poll_loop() -> None:
    writer, _ = _writer(_BrokenClient())

    # Хартбит — диагностика: если YT недоступен, опрос обязан продолжаться.
    writer.success(credits_remaining=100)
    writer.paused(STATUS_BUDGET_EXHAUSTED, credits_remaining=0, resumes_in=60)
