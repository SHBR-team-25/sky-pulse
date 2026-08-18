from typing import Any, cast

import yt.wrapper as yt

from ingest_service.writer import write_rows


class _FakeClient:
    def __init__(self) -> None:
        self.batches: list[list[dict[str, Any]]] = []

    def insert_rows(self, table_path: str, rows: list[dict[str, Any]]) -> None:
        self.batches.append(rows)


def _client() -> tuple[_FakeClient, yt.YtClient]:
    fake = _FakeClient()
    return fake, cast(yt.YtClient, fake)


def test_empty_snapshot_writes_nothing() -> None:
    fake, client = _client()

    write_rows(client, "//tmp/positions_raw", [])

    assert fake.batches == []


def test_small_snapshot_goes_in_one_call() -> None:
    fake, client = _client()
    rows = [{"icao24": str(i)} for i in range(10)]

    write_rows(client, "//tmp/positions_raw", rows)

    assert [len(batch) for batch in fake.batches] == [10]


def test_global_snapshot_is_split_into_chunks() -> None:
    fake, client = _client()
    rows = [{"icao24": str(i)} for i in range(2500)]

    write_rows(client, "//tmp/positions_raw", rows)

    assert [len(batch) for batch in fake.batches] == [1000, 1000, 500]
    assert [row for batch in fake.batches for row in batch] == rows
