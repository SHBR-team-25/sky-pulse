import importlib.util
from pathlib import Path
from types import SimpleNamespace


MODULE_PATH = Path(__file__).parents[2] / "spyt" / "launch" / "run_segment.py"
MODULE_SPEC = importlib.util.spec_from_file_location("project_run_segment", MODULE_PATH)
run_segment = importlib.util.module_from_spec(MODULE_SPEC)
MODULE_SPEC.loader.exec_module(run_segment)


def test_launcher_fixes_until_ts_once(monkeypatch):
    submitted = {}
    monkeypatch.setattr(run_segment.time, "time", lambda: 10_000)
    monkeypatch.setattr(
        run_segment,
        "submit",
        lambda *args, **kwargs: submitted.update(arguments=args[2], options=kwargs),
    )

    args = SimpleNamespace(
        proxy="https://proxy.example",
        token="token",
        job_path="//code/job_segment.py",
        skip_upload=True,
        airport_radius_km=15.0,
        inferred_departure_radius_km=5.0,
        inferred_departure_max_altitude_m=1000.0,
        inferred_departure_min_climb_ms=2.0,
        inferred_departure_min_distance_growth_km=0.2,
        timeout_seconds=1800,
        max_transition_gap_seconds=300,
        ground_glitch_max_seconds=60,
        allowed_lateness_seconds=120,
        observation_scope="all",
        bbox_lamin=45.0,
        bbox_lomin=5.0,
        bbox_lamax=55.0,
        bbox_lomax=25.0,
        bbox_exit_margin_km=25.0,
        num_executors=2,
        py_files="yt:///deps.zip",
        pyspark_python="/usr/bin/python3.11",
        driver_memory="4g",
        driver_memory_overhead="2g",
        executor_memory="4g",
        executor_cores=2,
        shuffle_partitions=16,
    )

    run_segment.run_job(args)

    until_index = submitted["arguments"].index("--until-ts")
    assert submitted["arguments"][until_index + 1] == "9880"
    assert submitted["options"]["driver_max_failures"] == 1
    assert submitted["options"]["try_avoid_duplicating_jobs"] is True
