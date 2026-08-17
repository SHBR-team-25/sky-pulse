import argparse
import os
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from pipeline.spyt.config.spark_config import CLUSTER_CONFIG, PATHS
from pipeline.spyt.launch.batch_common import (
    DEFAULT_PYSPARK_PYTHON, DEFAULT_PY_FILES, submit, upload_job_file,
)

LOCAL_JOB_PATH = Path(__file__).parent.parent / "jobs" / "job_aggregate.py"


def run_job(args):
    proxy = (args.proxy or os.getenv("YT_PROXY", CLUSTER_CONFIG["proxy"])).rstrip("/")
    token = args.token or os.getenv("YT_TOKEN", CLUSTER_CONFIG["token"])
    job_path = args.job_path or f"{PATHS['code']}/job_aggregate.py"

    if not args.skip_upload:
        print(f"Uploading job file to yt://{job_path}")
        upload_job_file(proxy, token, job_path, LOCAL_JOB_PATH)

    arguments = [
        "--airport-events", PATHS["airport_events"],
        "--positions-current", PATHS["positions_current"],
        "--flights-segments", PATHS["flights_segments"],
        "--ref-aircraft", PATHS["ref_aircraft"],
        "--dashboard-totals", PATHS["dashboard_totals"],
        "--dashboard-trend", PATHS["dashboard_trend"],
        "--dashboard-top-airports", PATHS["dashboard_top_airports"],
        "--dashboard-routes", PATHS["dashboard_routes"],
        "--dashboard-manufacturers", PATHS["dashboard_manufacturers"],
        "--top-limit", str(args.top_limit),
    ]

    return submit(proxy, job_path, arguments, args.num_executors, args.py_files, args.pyspark_python)


def main():
    parser = argparse.ArgumentParser(description="Run job_aggregate batch job periodically")
    parser.add_argument("--proxy")
    parser.add_argument("--token")
    parser.add_argument("--job-path")
    parser.add_argument("--num-executors", type=int, default=1)
    parser.add_argument("--top-limit", type=int, default=10)
    parser.add_argument("--py-files", default=DEFAULT_PY_FILES)
    parser.add_argument("--pyspark-python", default=DEFAULT_PYSPARK_PYTHON)
    parser.add_argument("--skip-upload", action="store_true")
    parser.add_argument("--interval", type=int, default=3600,
                        help="Interval between runs in seconds (default: 3600 = 1 hour)")
    parser.add_argument("--once", action="store_true",
                        help="Run once and exit (for manual testing)")
    args = parser.parse_args()

    if args.once:
        success = run_job(args)
        raise SystemExit(0 if success else 1)

    print(f"Starting job_aggregate scheduler. Interval: {args.interval} seconds ({args.interval//60} minutes)")
    print("Press Ctrl+C to stop")

    while True:
        try:
            print(f"\nRunning job_aggregate at {time.strftime('%Y-%m-%d %H:%M:%S')}")
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