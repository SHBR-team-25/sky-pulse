"""Print a conservative pipeline configuration from capacity declared in env."""

import math
import os
import sys
from dataclasses import dataclass


@dataclass(frozen=True)
class Capacity:
    cores: int
    memory_gb: float
    snapshot_rows: int
    poll_seconds: int

    @property
    def rows_per_second(self) -> float:
        return self.snapshot_rows / self.poll_seconds


def required_int(name: str) -> int:
    raw = os.getenv(name, "").strip()
    if not raw:
        raise ValueError(f"{name} is empty; set it in .env before running this script")
    value = int(raw)
    if value <= 0:
        raise ValueError(f"{name} must be positive")
    return value


def required_float(name: str) -> float:
    raw = os.getenv(name, "").strip()
    if not raw:
        raise ValueError(f"{name} is empty; set it in .env before running this script")
    value = float(raw)
    if not math.isfinite(value) or value <= 0:
        raise ValueError(f"{name} must be positive and finite")
    return value


def load_capacity() -> Capacity:
    return Capacity(
        cores=required_int("CLUSTER_AVAILABLE_CORES"),
        memory_gb=required_float("CLUSTER_AVAILABLE_MEMORY_GB"),
        snapshot_rows=required_int("EXPECTED_SNAPSHOT_ROWS"),
        poll_seconds=required_int("OPENSKY_POLL_INTERVAL_SECONDS"),
    )


def recommend(capacity: Capacity, environ: dict[str, str] | None = None) -> dict[str, str]:
    env = os.environ if environ is None else environ
    high_rate = capacity.rows_per_second >= 1_000

    # Reserve capacity for segment, aggregate and driver containers. Four streaming
    # executors are useful only if the whole pipeline still has that reserve.
    executor_count = min(4, max(1, (capacity.cores - 6) // 2))
    if capacity.memory_gb < 32:
        executor_count = min(executor_count, 2)

    enough_for_all = (
        capacity.cores >= 16
        and capacity.memory_gb >= 64
        and (not high_rate or executor_count >= 4)
    )
    scope = "all" if enough_for_all else "bbox"
    shuffle_partitions = max(8, executor_count * 8)
    trigger_seconds = max(5, min(30, capacity.poll_seconds * 3))
    segment_interval = 300 if high_rate else 900

    result = {
        "OPENSKY_SCOPE": scope,
        "OPENSKY_POLL_INTERVAL_SECONDS": str(capacity.poll_seconds),
        "STREAMING_DRIVER_MEMORY": "3g" if capacity.memory_gb >= 32 else "2g",
        "STREAMING_DRIVER_MEMORY_OVERHEAD": "2g",
        "STREAMING_EXECUTOR_MEMORY": "4g",
        "STREAMING_EXECUTOR_CORES": "2",
        "STREAMING_NUM_EXECUTORS": str(executor_count),
        "STREAMING_SHUFFLE_PARTITIONS": str(shuffle_partitions),
        "STREAMING_TRIGGER_SECONDS": str(trigger_seconds),
        "STREAMING_MAX_ROWS_PER_PARTITION": "50000",
        "SEGMENT_INTERVAL_SECONDS": str(segment_interval),
        "SEGMENT_DRIVER_MEMORY": "4g",
        "SEGMENT_DRIVER_MEMORY_OVERHEAD": "2g",
        "SEGMENT_EXECUTOR_MEMORY": "4g",
        "SEGMENT_EXECUTOR_CORES": "2",
        "SEGMENT_NUM_EXECUTORS": "2" if capacity.cores >= 10 else "1",
        "SEGMENT_SHUFFLE_PARTITIONS": "16" if capacity.cores >= 10 else "8",
    }
    if scope == "bbox":
        for name, default in (
            ("OPENSKY_BBOX_LAMIN", "45.0"),
            ("OPENSKY_BBOX_LOMIN", "5.0"),
            ("OPENSKY_BBOX_LAMAX", "55.0"),
            ("OPENSKY_BBOX_LOMAX", "25.0"),
        ):
            result[name] = env.get(name, default).strip() or default
    return result


def main() -> int:
    try:
        capacity = load_capacity()
    except (TypeError, ValueError) as error:
        print(f"Configuration error: {error}", file=sys.stderr)
        return 2

    recommendation = recommend(capacity)
    print(
        f"Estimated input rate: {capacity.rows_per_second:.1f} rows/s "
        f"({capacity.snapshot_rows} rows every {capacity.poll_seconds}s)"
    )
    print(f"Recommended scope: {recommendation['OPENSKY_SCOPE']}")
    if recommendation["OPENSKY_SCOPE"] == "bbox":
        print("Reason: capacity reserve is too small for a conservative all-world recommendation.")
    else:
        print("Reason: capacity has reserve for streaming, segment and aggregate jobs.")
    print("\n# Copy the following lines to .env after reviewing them:")
    for name, value in recommendation.items():
        print(f"{name}={value}")
    print("\nValidate the result with processedRowsPerSecond, batch duration and peak RSS.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
