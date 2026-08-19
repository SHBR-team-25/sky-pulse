import importlib.util
from pathlib import Path

import pytest


JOB_PATH = Path(__file__).parents[2] / "spyt" / "jobs" / "job_segment.py"
MODULE_SPEC = importlib.util.spec_from_file_location("project_job_segment", JOB_PATH)
job_segment = importlib.util.module_from_spec(MODULE_SPEC)
MODULE_SPEC.loader.exec_module(job_segment)

flight_id = job_segment.flight_id
process_aircraft_points = job_segment.process_aircraft_points
validate_parameters = job_segment.validate_parameters
ensure_watermark_unchanged = job_segment.ensure_watermark_unchanged
distance_km = job_segment.distance_km
nearest_airport = job_segment.nearest_airport
validate_open_state = job_segment.validate_open_state
validate_point = job_segment.validate_point
validate_results = job_segment.validate_results
delete_closed_open_states = job_segment.delete_closed_open_states


ICAO24 = "abc123"
AIRPORTS = [
    {
        "ident": "UUEE",
        "icao_code": "UUEE",
        "latitude_deg": 55.0,
        "longitude_deg": 37.0,
    }
]


def point(
    timestamp,
    *,
    on_ground,
    callsign="AFL100",
    lat=55.0,
    lon=37.0,
    baro_altitude=1_000.0,
):
    return {
        "icao24": ICAO24,
        "time_position": timestamp,
        "lat": lat,
        "lon": lon,
        "baro_altitude": baro_altitude,
        "vertical_rate": 0.0,
        "on_ground": on_ground,
        "callsign": callsign,
    }


def open_flight(last_ts=100, callsign="AFL100"):
    return {
        "icao24": ICAO24,
        "flight_id": "existing-flight",
        "start_ts": 50,
        "last_ts": last_ts,
        "last_on_ground": False,
        "last_lat": 55.0,
        "last_lon": 37.0,
        "last_baro_altitude": 1_000.0,
        "last_vertical_rate": 0.0,
        "last_callsign": callsign,
        "departure_icao": "UUEE",
        "departure_confidence": 0.9,
        "departure_distance_km": 1.5,
        "point_count": 3,
        "max_altitude_m": 1_000.0,
    }


def process(state, previous_point, points, until_ts):
    return process_aircraft_points(
        state=state,
        previous_point=previous_point,
        points=points,
        airports=[],
        until_ts=until_ts,
        timeout_seconds=50,
        max_transition_gap_seconds=30,
        ground_glitch_max_seconds=15,
        airport_radius_km=15.0,
    )


def test_timeout_closes_old_flight_and_starts_a_new_one():
    state, closed = process(
        state=open_flight(),
        previous_point=point(100, on_ground=False),
        points=[point(200, on_ground=False)],
        until_ts=200,
    )

    assert [segment["flight_id"] for segment in closed] == ["existing-flight"]
    assert closed[0]["closed_reason"] == "timeout"
    assert state["flight_id"] == flight_id(ICAO24, 200)
    assert state["flight_id"] != "existing-flight"
    assert state["departure_icao"] is None


def test_callsign_change_does_not_split_an_airborne_flight():
    state, closed = process(
        state=open_flight(),
        previous_point=point(100, on_ground=False),
        points=[point(110, on_ground=False, callsign="AFL200")],
        until_ts=110,
    )

    assert closed == []
    assert state["flight_id"] == "existing-flight"
    assert state["last_callsign"] == "AFL200"
    assert state["point_count"] == 4


def test_metrics_are_accumulated_in_open_state_and_copied_on_close():
    state, closed = process_aircraft_points(
        state=None,
        previous_point=point(90, on_ground=True),
        points=[
            point(100, on_ground=False, baro_altitude=1_000.0),
            point(110, on_ground=False, baro_altitude=2_500.0),
            point(120, on_ground=True, baro_altitude=None),
            point(130, on_ground=True, baro_altitude=None),
        ],
        airports=AIRPORTS,
        until_ts=130,
        timeout_seconds=50,
        max_transition_gap_seconds=30,
        ground_glitch_max_seconds=15,
        airport_radius_km=15.0,
    )

    assert state is None
    assert len(closed) == 1
    assert closed[0]["point_count"] == 3
    assert closed[0]["max_altitude_m"] == 2_500.0
    assert closed[0]["departure_distance_km"] == 0.0


def test_first_known_callsign_does_not_split_an_airborne_flight():
    state, closed = process(
        state=open_flight(callsign=None),
        previous_point=point(100, on_ground=False, callsign=None),
        points=[point(110, on_ground=False, callsign="AFL100")],
        until_ts=110,
    )

    assert closed == []
    assert state["flight_id"] == "existing-flight"
    assert state["last_callsign"] == "AFL100"


def test_takeoff_after_landing_does_not_reopen_landed_flight():
    state, closed = process(
        state=open_flight(),
        previous_point=point(100, on_ground=False),
        points=[
            point(110, on_ground=True),
            point(120, on_ground=True),
            point(130, on_ground=False),
        ],
        until_ts=130,
    )

    assert [segment["flight_id"] for segment in closed] == ["existing-flight"]
    assert closed[0]["closed_reason"] == "landing"
    assert closed[0]["end_ts"] == 110
    assert state["flight_id"] == flight_id(ICAO24, 130)
    assert state["flight_id"] != "existing-flight"


def test_single_ground_glitch_does_not_split_a_flight():
    state, closed = process(
        state=open_flight(),
        previous_point=point(100, on_ground=False),
        points=[
            point(110, on_ground=True),
            point(120, on_ground=False),
        ],
        until_ts=120,
    )

    assert closed == []
    assert state["flight_id"] == "existing-flight"
    assert state["last_on_ground"] is False
    assert state["last_ts"] == 120


def test_airborne_point_after_ground_dwell_starts_a_new_flight():
    state, closed = process(
        state=open_flight(),
        previous_point=point(100, on_ground=False),
        points=[
            point(110, on_ground=True),
            point(130, on_ground=False),
        ],
        until_ts=130,
    )

    assert len(closed) == 1
    assert closed[0]["flight_id"] == "existing-flight"
    assert closed[0]["closed_reason"] == "landing"
    assert closed[0]["end_ts"] == 110
    assert state["flight_id"] == flight_id(ICAO24, 130)


def test_callsign_change_on_landing_does_not_hide_landing():
    state, closed = process(
        state=open_flight(),
        previous_point=point(100, on_ground=False),
        points=[
            point(110, on_ground=True, callsign="AFL200"),
            point(120, on_ground=True, callsign="AFL200"),
        ],
        until_ts=120,
    )

    assert len(closed) == 1
    assert closed[0]["closed_reason"] == "landing"
    assert closed[0]["end_ts"] == 110
    assert closed[0]["callsign"] == "AFL200"
    assert state is None


def test_first_airborne_observation_has_unknown_departure():
    state, closed = process(
        state=None,
        previous_point=None,
        points=[point(100, on_ground=False)],
        until_ts=100,
    )

    assert closed == []
    assert state["departure_icao"] is None
    assert state["departure_confidence"] is None


def test_unknown_departure_stays_unknown_when_flight_lands_near_airport():
    state, closed = process_aircraft_points(
        state=None,
        previous_point=None,
        points=[
            point(100, on_ground=False),
            point(110, on_ground=True),
            point(120, on_ground=True),
        ],
        airports=AIRPORTS,
        until_ts=120,
        timeout_seconds=50,
        max_transition_gap_seconds=30,
        ground_glitch_max_seconds=15,
        airport_radius_km=15.0,
    )

    assert state is None
    assert len(closed) == 1
    assert closed[0]["departure_icao"] is None
    assert closed[0]["arrival_icao"] == "UUEE"


def test_recent_ground_to_air_transition_gets_departure_airport():
    state, closed = process_aircraft_points(
        state=None,
        previous_point=point(90, on_ground=True),
        points=[point(100, on_ground=False)],
        airports=AIRPORTS,
        until_ts=100,
        timeout_seconds=50,
        max_transition_gap_seconds=30,
        ground_glitch_max_seconds=15,
        airport_radius_km=15.0,
    )

    assert closed == []
    assert state["departure_icao"] == "UUEE"
    assert state["departure_confidence"] == 1.0
    assert state["departure_distance_km"] == 0.0
    assert state["point_count"] == 1
    assert state["max_altitude_m"] == 1_000.0


def test_short_ground_air_ground_transition_at_same_airport_is_discarded():
    state, closed = process_aircraft_points(
        state=None,
        previous_point=point(90, on_ground=True),
        points=[
            point(100, on_ground=False),
            point(110, on_ground=True),
            point(120, on_ground=True),
        ],
        airports=AIRPORTS,
        until_ts=120,
        timeout_seconds=50,
        max_transition_gap_seconds=30,
        ground_glitch_max_seconds=15,
        airport_radius_km=15.0,
    )

    assert state is None
    assert closed == []


def test_same_airport_flight_longer_than_glitch_window_is_kept():
    state, closed = process_aircraft_points(
        state=None,
        previous_point=point(90, on_ground=True),
        points=[
            point(100, on_ground=False),
            point(120, on_ground=False),
            point(130, on_ground=True),
            point(140, on_ground=True),
        ],
        airports=AIRPORTS,
        until_ts=140,
        timeout_seconds=50,
        max_transition_gap_seconds=30,
        ground_glitch_max_seconds=15,
        airport_radius_km=15.0,
    )

    assert state is None
    assert len(closed) == 1
    assert closed[0]["departure_icao"] == "UUEE"
    assert closed[0]["arrival_icao"] == "UUEE"


def test_departure_uses_last_ground_position_not_first_airborne_position():
    state, closed = process_aircraft_points(
        state=None,
        previous_point=point(90, on_ground=True),
        points=[point(100, on_ground=False, lat=56.0, lon=38.0)],
        airports=AIRPORTS,
        until_ts=100,
        timeout_seconds=50,
        max_transition_gap_seconds=30,
        ground_glitch_max_seconds=15,
        airport_radius_km=15.0,
    )

    assert closed == []
    assert state["departure_icao"] == "UUEE"


def test_stale_ground_observation_does_not_prove_takeoff():
    state, closed = process_aircraft_points(
        state=None,
        previous_point=point(10, on_ground=True),
        points=[point(100, on_ground=False)],
        airports=[],
        until_ts=100,
        timeout_seconds=50,
        max_transition_gap_seconds=30,
        ground_glitch_max_seconds=15,
        airport_radius_km=15.0,
    )

    assert closed == []
    assert state["departure_icao"] is None


def test_pending_landing_is_closed_as_landing_after_observation_timeout():
    state, closed = process(
        state=open_flight(),
        previous_point=point(100, on_ground=False),
        points=[point(110, on_ground=True)],
        until_ts=200,
    )

    assert state is None
    assert len(closed) == 1
    assert closed[0]["closed_reason"] == "landing"
    assert closed[0]["end_ts"] == 110


def test_already_processed_point_does_not_move_state_backwards():
    state, closed = process(
        state=open_flight(last_ts=120),
        previous_point=point(100, on_ground=False),
        points=[point(110, on_ground=True)],
        until_ts=120,
    )

    assert closed == []
    assert state["flight_id"] == "existing-flight"
    assert state["last_ts"] == 120
    assert state["last_on_ground"] is False


def test_multiple_flights_in_one_batch_have_unique_ids_and_ordered_bounds():
    state, closed = process_aircraft_points(
        state=None,
        previous_point=point(90, on_ground=True),
        points=[
            point(100, on_ground=False),
            point(120, on_ground=True),
            point(130, on_ground=True),
            point(140, on_ground=False, callsign="AFL200"),
            point(200, on_ground=False, callsign="AFL300"),
        ],
        airports=AIRPORTS,
        until_ts=200,
        timeout_seconds=50,
        max_transition_gap_seconds=30,
        ground_glitch_max_seconds=15,
        airport_radius_km=15.0,
    )

    closed_ids = [segment["flight_id"] for segment in closed]
    assert closed_ids == [flight_id(ICAO24, 100), flight_id(ICAO24, 140)]
    assert len(closed_ids) == len(set(closed_ids))
    assert all(segment["start_ts"] <= segment["end_ts"] for segment in closed)
    assert state["flight_id"] == flight_id(ICAO24, 200)
    assert state["flight_id"] not in closed_ids


@pytest.mark.parametrize(
    (
        "airport_radius_km",
        "timeout_seconds",
        "max_transition_gap_seconds",
        "ground_glitch_max_seconds",
        "lateness",
    ),
    [
        (0.0, 50, 30, 15, 0),
        (float("nan"), 50, 30, 15, 0),
        (15.0, 0, 30, 15, 0),
        (15.0, 50, 0, 0, 0),
        (15.0, 50, 60, 15, 0),
        (15.0, 50, 30, -1, 0),
        (15.0, 50, 30, 40, 0),
        (15.0, 50, 30, 15, -1),
    ],
)
def test_invalid_configuration_is_rejected(
    airport_radius_km,
    timeout_seconds,
    max_transition_gap_seconds,
    ground_glitch_max_seconds,
    lateness,
):
    with pytest.raises(ValueError):
        validate_parameters(
            airport_radius_km=airport_radius_km,
            timeout_seconds=timeout_seconds,
            max_transition_gap_seconds=max_transition_gap_seconds,
            ground_glitch_max_seconds=ground_glitch_max_seconds,
            allowed_lateness_seconds=lateness,
        )


def test_changed_watermark_aborts_before_writes(monkeypatch):
    monkeypatch.setattr(job_segment, "load_watermark", lambda spark, path: 200)

    with pytest.raises(RuntimeError, match="Another job_segment instance"):
        ensure_watermark_unchanged(object(), "//job-state", expected_watermark=100)


def test_unchanged_watermark_is_accepted(monkeypatch):
    monkeypatch.setattr(job_segment, "load_watermark", lambda spark, path: 100)

    ensure_watermark_unchanged(object(), "//job-state", expected_watermark=100)


def test_closed_open_states_are_deleted_by_primary_key():
    class Client:
        def __init__(self):
            self.calls = []

        def delete_rows(self, path, keys, **kwargs):
            self.calls.append((path, keys))

    client = Client()
    delete_closed_open_states(
        client,
        "//flights_open",
        {"aaa111", "bbb222", "ccc333"},
        {"bbb222": {"icao24": "bbb222"}},
    )

    assert client.calls == [
        (
            "//flights_open",
            [{"icao24": "aaa111"}, {"icao24": "ccc333"}],
        )
    ]


def test_no_delete_request_when_all_open_states_remain():
    class Client:
        def delete_rows(self, path, keys, **kwargs):
            raise AssertionError("delete_rows must not be called")

    delete_closed_open_states(
        Client(),
        "//flights_open",
        {"aaa111"},
        {"aaa111": {"icao24": "aaa111"}},
    )


def test_antipodal_distance_is_finite():
    assert distance_km(0.0, 0.0, 0.0, 180.0) == pytest.approx(20_015.1, rel=1e-4)


@pytest.mark.parametrize("radius", [0.0, -1.0, float("nan")])
def test_nearest_airport_rejects_invalid_radius(radius):
    with pytest.raises(ValueError):
        nearest_airport(55.0, 37.0, AIRPORTS, radius)


def test_nearest_airport_handles_the_date_line():
    airports = [
        {
            "ident": "DATELINE",
            "icao_code": None,
            "latitude_deg": 0.0,
            "longitude_deg": -179.99,
        }
    ]

    airport, confidence, distance = nearest_airport(0.0, 179.99, airports, 5.0)

    assert airport == "DATELINE"
    assert confidence > 0
    assert distance == pytest.approx(2.224, rel=1e-3)


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("icao24", None),
        ("time_position", None),
        ("on_ground", None),
        ("lat", float("nan")),
        ("lat", 91.0),
        ("lon", -181.0),
    ],
)
def test_invalid_position_is_rejected(field, value):
    invalid_point = point(100, on_ground=False)
    invalid_point[field] = value

    with pytest.raises(ValueError):
        validate_point(invalid_point)


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("flight_id", None),
        ("start_ts", None),
        ("last_on_ground", None),
        ("departure_confidence", -0.1),
        ("departure_confidence", 1.1),
    ],
)
def test_invalid_open_state_is_rejected(field, value):
    invalid_state = open_flight()
    invalid_state[field] = value

    with pytest.raises(ValueError):
        validate_open_state(invalid_state)


def test_open_state_with_reversed_timestamps_is_rejected():
    invalid_state = open_flight(last_ts=40)

    with pytest.raises(ValueError):
        validate_open_state(invalid_state)


def test_result_validation_rejects_duplicate_closed_flight_ids():
    segment = {
        "flight_id": "duplicate",
        "start_ts": 100,
        "end_ts": 200,
    }

    with pytest.raises(RuntimeError, match="closed more than once"):
        validate_results({}, [segment, dict(segment)])


def test_result_validation_rejects_open_and_closed_flight():
    state = open_flight()
    segment = {
        "flight_id": state["flight_id"],
        "start_ts": 50,
        "end_ts": 100,
    }

    with pytest.raises(RuntimeError, match="both open and closed"):
        validate_results({ICAO24: state}, [segment])


def test_result_validation_accepts_consistent_results():
    validate_results(
        {ICAO24: open_flight()},
        [{"flight_id": "closed-flight", "start_ts": 10, "end_ts": 20}],
    )
