import importlib.util
import sys
import time
from pathlib import Path

import pytest
from pyspark.sql import SparkSession


JOB_PATH = Path(__file__).parents[2] / "spyt" / "jobs" / "streaming_job.py"
MODULE_SPEC = importlib.util.spec_from_file_location("project_streaming_job", JOB_PATH)
streaming_job = importlib.util.module_from_spec(MODULE_SPEC)
MODULE_SPEC.loader.exec_module(streaming_job)

enrich = streaming_job.enrich
latest_per_aircraft = streaming_job.latest_per_aircraft
newer_than_current = streaming_job.newer_than_current
parse_arguments = streaming_job.parse_arguments


@pytest.fixture(scope="module")
def spark():
    session = (
        SparkSession.builder.master("local[1]")
        .appName("streaming-job-tests")
        .config("spark.ui.enabled", "false")
        .config("spark.sql.shuffle.partitions", "1")
        .getOrCreate()
    )
    yield session
    session.stop()


def test_enrich_keeps_known_and_unknown_aircraft(spark):
    raw = spark.createDataFrame(
        [
            ("known", 100, "KNOWN1"),
            ("unknown", 200, "UNKNOWN1"),
            (None, 300, "NOICAO"),
        ],
        "icao24 string, time_position long, callsign string",
    )
    aircraft = spark.createDataFrame(
        [("known", "Airbus", "A320")],
        "icao24 string, manufacturername string, model string",
    )
    before = int(time.time())

    rows = {
        row["callsign"]: row.asDict()
        for row in enrich(raw, aircraft).collect()
    }
    after = int(time.time())

    assert set(rows) == {"KNOWN1", "UNKNOWN1", "NOICAO"}
    assert rows["KNOWN1"]["manufacturername"] == "Airbus"
    assert rows["KNOWN1"]["model"] == "A320"
    assert rows["UNKNOWN1"]["manufacturername"] is None
    assert rows["UNKNOWN1"]["model"] is None
    assert rows["NOICAO"]["manufacturername"] is None
    assert rows["NOICAO"]["model"] is None
    assert all(
        before <= row["enriched_at"] <= after
        for row in rows.values()
    )


def test_enrich_preserves_raw_position_fields(spark):
    raw = spark.createDataFrame(
        [("abc123", 500, 55.75, 37.62, False)],
        """
            icao24 string,
            time_position long,
            lat double,
            lon double,
            on_ground boolean
        """,
    )
    aircraft = spark.createDataFrame(
        [("abc123", "Boeing")],
        "icao24 string, manufacturername string",
    )

    row = enrich(raw, aircraft).first()

    assert row["icao24"] == "abc123"
    assert row["time_position"] == 500
    assert row["lat"] == 55.75
    assert row["lon"] == 37.62
    assert row["on_ground"] is False
    assert row["manufacturername"] == "Boeing"
    assert row["enriched_at"] is not None


def test_current_position_never_moves_backwards(spark):
    batch = spark.createDataFrame(
        [("abc123", 100, "old"), ("abc123", 300, "new"), ("def456", 200, "first")],
        "icao24 string, time_position long, callsign string",
    )
    current = spark.createDataFrame(
        [("abc123", 400), ("def456", 150)],
        "icao24 string, time_position long",
    )

    rows = newer_than_current(latest_per_aircraft(batch), current).collect()

    assert [(row["icao24"], row["time_position"]) for row in rows] == [("def456", 200)]


def test_parse_arguments_returns_all_paths(monkeypatch):
    arguments = [
        "streaming_job.py",
        "--positions-raw",
        "//raw",
        "--positions-raw-consumer",
        "//consumer",
        "--ref-aircraft",
        "//aircraft",
        "--positions-current",
        "//current",
        "--positions-history",
        "//history",
        "--checkpoint",
        "//checkpoint",
    ]
    monkeypatch.setattr(sys, "argv", arguments)

    args = parse_arguments()

    assert vars(args) == {
        "positions_raw": "//raw",
        "positions_raw_consumer": "//consumer",
        "ref_aircraft": "//aircraft",
        "positions_current": "//current",
        "positions_history": "//history",
        "checkpoint": "//checkpoint",
        "trigger_seconds": 30,
        "max_rows_per_partition": 50_000,
    }


def test_parse_arguments_rejects_missing_required_path(monkeypatch):
    monkeypatch.setattr(sys, "argv", ["streaming_job.py"])

    with pytest.raises(SystemExit) as error:
        parse_arguments()

    assert error.value.code == 2
