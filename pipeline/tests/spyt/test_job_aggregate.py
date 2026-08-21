import importlib.util
from pathlib import Path

import pytest
from pyspark.sql import SparkSession


JOB_PATH = Path(__file__).parents[2] / "spyt" / "jobs" / "job_aggregate.py"
MODULE_SPEC = importlib.util.spec_from_file_location("project_job_aggregate", JOB_PATH)
job_aggregate = importlib.util.module_from_spec(MODULE_SPEC)
MODULE_SPEC.loader.exec_module(job_aggregate)

build_manufacturers = job_aggregate.build_manufacturers
build_routes = job_aggregate.build_routes
build_top_airports = job_aggregate.build_top_airports
build_totals = job_aggregate.build_totals
build_trend = job_aggregate.build_trend
choose_computed_at = job_aggregate.choose_computed_at
materialize_positions_snapshot = job_aggregate.materialize_positions_snapshot
validate_parameters = job_aggregate.validate_parameters


@pytest.fixture(scope="module")
def spark():
    session = (
        SparkSession.builder.master("local[1]")
        .appName("job-aggregate-tests")
        .config("spark.ui.enabled", "false")
        .config("spark.sql.shuffle.partitions", "1")
        .getOrCreate()
    )
    yield session
    session.stop()


def positions(spark, rows):
    schema = """
        icao24 string,
        time_position long,
        on_ground boolean,
        baro_altitude double,
        velocity double,
        vertical_rate double,
        squawk string
    """
    return spark.createDataFrame(rows, schema)


def events(spark, rows):
    schema = "airport_icao string, event_ts long, flight_id string, direction string"
    return spark.createDataFrame(rows, schema)


def segments(spark, rows):
    schema = """
        flight_id string,
        icao24 string,
        end_ts long,
        departure_icao string,
        arrival_icao string,
        point_count long
    """
    normalized_rows = [row if len(row) == 6 else (*row, 10) for row in rows]
    return spark.createDataFrame(normalized_rows, schema)


def aircraft(spark, rows):
    return spark.createDataFrame(rows, "icao24 string, manufacturername string")


def test_totals_use_only_fresh_positions_and_past_events(spark):
    current_positions = positions(
        spark,
        [
            ("air", 950, False, 1_000.0, 100.0, 2.0, "7500"),
            ("air", 940, True, 0.0, 0.0, 0.0, None),
            ("ground", 960, True, 0.0, 5.0, 3.0, None),
            ("stale", 899, False, 9_000.0, 900.0, -5.0, "7700"),
            ("future", 1_001, False, 8_000.0, 800.0, -5.0, "7700"),
        ],
    )
    airport_events = events(
        spark,
        [
            ("UUEE", 950, "f1", "departure"),
            ("INVALID", 970, "broken", "unknown"),
            ("UUDD", 100, "f2", "arrival"),
            ("FUTURE", 1_001, "f3", "arrival"),
        ],
    )

    row = build_totals(
        positions=current_positions,
        events=airport_events,
        computed_at=1_000,
        window_seconds=200,
        position_freshness_seconds=100,
    ).first()

    assert row.asDict() == {
        "computed_at": 1_000,
        "active_flights": 1,
        "tracked_airports": 1,
        "avg_altitude_m": 1_000.0,
        "avg_velocity_mps": 100.0,
        "airborne": 1,
        "on_ground": 1,
        "climbing": 1,
        "descending": 0,
        "emergency_squawks": 1,
    }


def test_empty_totals_have_zero_counts(spark):
    row = build_totals(
        positions=positions(spark, []),
        events=events(spark, []),
        computed_at=1_000,
        window_seconds=200,
        position_freshness_seconds=100,
    ).first()

    assert row["active_flights"] == 0
    assert row["tracked_airports"] == 0
    assert row["airborne"] == 0
    assert row["on_ground"] == 0
    assert row["climbing"] == 0
    assert row["descending"] == 0
    assert row["emergency_squawks"] == 0
    assert row["avg_altitude_m"] is None
    assert row["avg_velocity_mps"] is None


def test_trend_uses_active_flights_from_totals(spark):
    totals = spark.createDataFrame([(1_000, 7)], "computed_at long, active_flights long")

    assert build_trend(totals).first().asDict() == {
        "computed_at": 1_000,
        "active_aircraft": 7,
    }


def test_materialized_position_snapshot_reports_latest_timestamp(spark):
    current_positions = positions(
        spark,
        [
            ("old", 950, False, 1_000.0, 100.0, 2.0, None),
            ("new", 1_005, False, 2_000.0, 200.0, 3.0, None),
        ],
    )

    snapshot, latest_position_ts = materialize_positions_snapshot(current_positions)
    try:
        assert snapshot.is_cached
        assert snapshot.count() == 2
        assert latest_position_ts == 1_005
    finally:
        snapshot.unpersist()


def test_computed_at_is_not_older_than_frozen_position_snapshot():
    assert choose_computed_at(None, latest_position_ts=1_005, now_ts=1_000) == 1_005
    assert choose_computed_at(None, latest_position_ts=995, now_ts=1_000) == 1_000
    assert choose_computed_at(None, latest_position_ts=None, now_ts=1_000) == 1_000


def test_explicit_computed_at_is_preserved_for_reproducible_runs():
    assert choose_computed_at(900, latest_position_ts=1_005, now_ts=1_000) == 900


def test_top_airports_count_directions_and_unique_flights(spark):
    airport_events = events(
        spark,
        [
            ("AAA", 900, "f1", "departure"),
            ("AAA", 910, "f1", "arrival"),
            ("AAA", 920, "f2", "arrival"),
            ("BBB", 930, "f3", "departure"),
            ("OLD", 799, "f4", "departure"),
            ("FUTURE", 1_001, "f5", "departure"),
            ("INVALID", 940, "f6", "unknown"),
        ],
    )

    rows = build_top_airports(
        events=airport_events,
        computed_at=1_000,
        window_seconds=200,
        top_limit=10,
    ).collect()

    assert [row.asDict() for row in rows] == [
        {
            "rank": 1,
            "airport_icao": "AAA",
            "departures": 1,
            "arrivals": 2,
            "total_flights": 2,
            "computed_at": 1_000,
        },
        {
            "rank": 2,
            "airport_icao": "BBB",
            "departures": 1,
            "arrivals": 0,
            "total_flights": 1,
            "computed_at": 1_000,
        },
    ]


def test_routes_exclude_unknown_old_and_future_segments(spark):
    flight_segments = segments(
        spark,
        [
            ("f1", "a1", 900, "AAA", "BBB"),
            ("f2", "a2", 910, "AAA", "BBB"),
            ("f3", "a3", 920, "BBB", "AAA"),
            ("f4", "a4", 930, None, "AAA"),
            ("old", "a5", 799, "OLD", "AAA"),
            ("future", "a6", 1_001, "AAA", "FUTURE"),
        ],
    )

    rows = build_routes(
        segments=flight_segments,
        computed_at=1_000,
        window_seconds=200,
        top_limit=10,
    ).collect()

    assert [row.asDict() for row in rows] == [
        {
            "rank": 1,
            "departure_icao": "AAA",
            "arrival_icao": "BBB",
            "flight_count": 2,
            "computed_at": 1_000,
        },
        {
            "rank": 2,
            "departure_icao": "BBB",
            "arrival_icao": "AAA",
            "flight_count": 1,
            "computed_at": 1_000,
        },
    ]


def test_routes_exclude_weak_same_airport_segments(spark):
    flight_segments = segments(
        spark,
        [
            ("weak", "a1", 900, "AAA", "AAA", 2),
            ("local", "a2", 910, "AAA", "AAA", 3),
            ("route", "a3", 920, "AAA", "BBB", 2),
        ],
    )

    rows = build_routes(
        segments=flight_segments,
        computed_at=1_000,
        window_seconds=200,
        top_limit=10,
    ).collect()

    assert {
        (row["departure_icao"], row["arrival_icao"], row["flight_count"])
        for row in rows
    } == {("AAA", "AAA", 1), ("AAA", "BBB", 1)}


def test_manufacturers_trim_names_and_use_unknown(spark):
    flight_segments = segments(
        spark,
        [
            ("f1", "a1", 900, "AAA", "BBB"),
            ("f2", "a1", 910, "AAA", "BBB"),
            ("f3", "a2", 920, "AAA", "BBB"),
            ("f4", "a3", 930, "AAA", "BBB"),
            ("old", "a1", 799, "AAA", "BBB"),
            ("future", "a1", 1_001, "AAA", "BBB"),
        ],
    )
    reference = aircraft(
        spark,
        [
            ("a1", " Airbus "),
            ("a2", "   "),
        ],
    )

    rows = build_manufacturers(
        segments=flight_segments,
        aircraft=reference,
        computed_at=1_000,
        window_seconds=200,
    ).collect()

    assert [row.asDict() for row in rows] == [
        {"manufacturer": "Airbus", "flight_count": 2, "computed_at": 1_000},
        {"manufacturer": "Unknown", "flight_count": 2, "computed_at": 1_000},
    ]


@pytest.mark.parametrize(
    ("computed_at", "top_limit", "window_seconds", "freshness_seconds"),
    [
        (0, 10, 86_400, 300),
        (1_000, 0, 86_400, 300),
        (1_000, 10, 0, 300),
        (1_000, 10, 86_400, 0),
    ],
)
def test_invalid_parameters_are_rejected(
    computed_at,
    top_limit,
    window_seconds,
    freshness_seconds,
):
    with pytest.raises(ValueError):
        validate_parameters(
            computed_at=computed_at,
            top_limit=top_limit,
            window_seconds=window_seconds,
            position_freshness_seconds=freshness_seconds,
        )
