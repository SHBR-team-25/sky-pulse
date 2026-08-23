import argparse
import os
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from pipeline.spyt.config.spark_config import CLUSTER_CONFIG, PATHS, SEGMENT_CONFIG
from pipeline.spyt.launch.batch_common import (
    DEFAULT_PY_FILES,
    DEFAULT_PYSPARK_PYTHON,
    submit,
    upload_job_file,
)

LOCAL_JOB_PATH = Path(__file__).parent.parent / "jobs" / "job_segment.py"


def run_job(args):
    """Запускает одну итерацию job_segment."""
    proxy = (args.proxy or os.getenv("YT_PROXY", CLUSTER_CONFIG["proxy"])).rstrip("/")
    token = args.token or os.getenv("YT_TOKEN", CLUSTER_CONFIG["token"])
    job_path = args.job_path or f"{PATHS['code']}/job_segment.py"

    if not args.skip_upload:
        print(f"Uploading job file to yt://{job_path}")
        upload_job_file(proxy, token, job_path, LOCAL_JOB_PATH)

    # A physical driver retry must process exactly the same logical batch.  If
    # every driver derives this boundary from its own wall clock, retries can
    # race while reading and advancing different watermark ranges.
    until_ts = int(time.time()) - args.allowed_lateness_seconds

    arguments = [
        "--positions-history",
        PATHS["positions_history"],
        "--flights-open",
        PATHS["flights_open"],
        "--ref-airports",
        PATHS["ref_airports"],
        "--flights-segments",
        PATHS["flights_segments"],
        "--airport-events",
        PATHS["airport_events"],
        "--job-state",
        PATHS["pipeline_job_state"],
        "--proxy",
        proxy,
        "--airport-radius-km",
        str(args.airport_radius_km),
        "--inferred-departure-radius-km",
        str(args.inferred_departure_radius_km),
        "--inferred-departure-max-altitude-m",
        str(args.inferred_departure_max_altitude_m),
        "--inferred-departure-min-climb-ms",
        str(args.inferred_departure_min_climb_ms),
        "--inferred-departure-min-distance-growth-km",
        str(args.inferred_departure_min_distance_growth_km),
        "--timeout-seconds",
        str(args.timeout_seconds),
        "--max-transition-gap-seconds",
        str(args.max_transition_gap_seconds),
        "--ground-glitch-max-seconds",
        str(args.ground_glitch_max_seconds),
        "--allowed-lateness-seconds",
        str(args.allowed_lateness_seconds),
        "--until-ts",
        str(until_ts),
        "--observation-scope",
        args.observation_scope,
        "--bbox-lamin",
        str(args.bbox_lamin),
        "--bbox-lomin",
        str(args.bbox_lomin),
        "--bbox-lamax",
        str(args.bbox_lamax),
        "--bbox-lomax",
        str(args.bbox_lomax),
        "--bbox-exit-margin-km",
        str(args.bbox_exit_margin_km),
    ]

    return submit(
        proxy,
        job_path,
        arguments,
        args.num_executors,
        args.py_files,
        args.pyspark_python,
        driver_memory=args.driver_memory,
        driver_memory_overhead=args.driver_memory_overhead,
        executor_memory=args.executor_memory,
        executor_cores=args.executor_cores,
        shuffle_partitions=args.shuffle_partitions,
        driver_max_failures=1,
        try_avoid_duplicating_jobs=True,
    )


def main():
    parser = argparse.ArgumentParser(description="Run job_segment batch job periodically")
    parser.add_argument("--proxy")
    parser.add_argument("--token")
    parser.add_argument("--job-path")
    parser.add_argument("--num-executors", type=int, default=SEGMENT_CONFIG["num_executors"])
    parser.add_argument("--driver-memory", default=SEGMENT_CONFIG["driver_memory"])
    parser.add_argument(
        "--driver-memory-overhead",
        default=SEGMENT_CONFIG["driver_memory_overhead"],
    )
    parser.add_argument("--executor-memory", default=SEGMENT_CONFIG["executor_memory"])
    parser.add_argument("--executor-cores", type=int, default=SEGMENT_CONFIG["executor_cores"])
    parser.add_argument(
        "--shuffle-partitions",
        type=int,
        default=SEGMENT_CONFIG["shuffle_partitions"],
    )
    parser.add_argument(
        "--airport-radius-km",
        type=float,
        default=SEGMENT_CONFIG["airport_radius_km"],
    )
    parser.add_argument(
        "--timeout-seconds",
        type=int,
        default=SEGMENT_CONFIG["flight_timeout_seconds"],
    )
    parser.add_argument(
        "--inferred-departure-radius-km",
        type=float,
        default=SEGMENT_CONFIG["inferred_departure_radius_km"],
    )
    parser.add_argument(
        "--inferred-departure-max-altitude-m",
        type=float,
        default=SEGMENT_CONFIG["inferred_departure_max_altitude_m"],
    )
    parser.add_argument(
        "--inferred-departure-min-climb-ms",
        type=float,
        default=SEGMENT_CONFIG["inferred_departure_min_climb_ms"],
    )
    parser.add_argument(
        "--inferred-departure-min-distance-growth-km",
        type=float,
        default=SEGMENT_CONFIG["inferred_departure_min_distance_growth_km"],
    )
    parser.add_argument(
        "--max-transition-gap-seconds",
        type=int,
        default=SEGMENT_CONFIG["max_transition_gap_seconds"],
    )
    parser.add_argument(
        "--ground-glitch-max-seconds",
        type=int,
        default=SEGMENT_CONFIG["ground_glitch_max_seconds"],
    )
    parser.add_argument(
        "--allowed-lateness-seconds",
        type=int,
        default=SEGMENT_CONFIG["allowed_lateness_seconds"],
    )
    parser.add_argument(
        "--observation-scope",
        choices=("bbox", "all"),
        default=SEGMENT_CONFIG["opensky_scope"],
    )
    parser.add_argument("--bbox-lamin", type=float, default=SEGMENT_CONFIG["bbox_lamin"])
    parser.add_argument("--bbox-lomin", type=float, default=SEGMENT_CONFIG["bbox_lomin"])
    parser.add_argument("--bbox-lamax", type=float, default=SEGMENT_CONFIG["bbox_lamax"])
    parser.add_argument("--bbox-lomax", type=float, default=SEGMENT_CONFIG["bbox_lomax"])
    parser.add_argument(
        "--bbox-exit-margin-km",
        type=float,
        default=SEGMENT_CONFIG["bbox_exit_margin_km"],
    )
    parser.add_argument("--py-files", default=DEFAULT_PY_FILES)
    parser.add_argument("--pyspark-python", default=DEFAULT_PYSPARK_PYTHON)
    parser.add_argument("--skip-upload", action="store_true")
    parser.add_argument(
        "--interval",
        type=int,
        default=SEGMENT_CONFIG["interval_seconds"],
        help="Interval between runs in seconds",
    )
    parser.add_argument(
        "--once",
        action="store_true",
        help="Run once and exit (for manual testing)",
    )
    args = parser.parse_args()

    if args.once:
        # Одиночный запуск для тестирования
        success = run_job(args)
        raise SystemExit(0 if success else 1)

    print(
        "Starting job_segment scheduler. "
        f"Interval: {args.interval} seconds ({args.interval // 60} minutes)"
    )
    print("Press Ctrl+C to stop")

    while True:
        try:
            print(f"\nRunning job_segment at {time.strftime('%Y-%m-%d %H:%M:%S')}")
            success = run_job(args)
            if success:
                print(f"Job completed successfully at {time.strftime('%Y-%m-%d %H:%M:%S')}")
            else:
                print(f"Job failed at {time.strftime('%Y-%m-%d %H:%M:%S')}")
        except KeyboardInterrupt:
            print("\nScheduler stopped by user")
            break
        except Exception as e:
            print(f"Unexpected error: {e}")

        print(f"Waiting {args.interval} seconds until next run...")
        time.sleep(args.interval)


if __name__ == "__main__":
    main()
