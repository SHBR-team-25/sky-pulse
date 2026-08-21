import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from pipeline.config import YT_PROXY, BASE_PATH
from pipeline.common.paths import table_paths

TEAM_BASE_PATH = os.getenv('YT_BASE_PATH', BASE_PATH)

CLUSTER_CONFIG = {
    'proxy': os.getenv('YT_PROXY', YT_PROXY),
    'token': os.getenv('YT_TOKEN', ''),
    'pool': os.getenv('YT_POOL', 'default'),
    'worker_cores': int(os.getenv('WORKER_CORES', 8)),
    'worker_num': int(os.getenv('WORKER_NUM', 3)),
    'worker_memory': os.getenv('WORKER_MEMORY', '32G'),
}

SEGMENT_CONFIG = {
    'opensky_scope': os.getenv('OPENSKY_SCOPE', 'bbox').strip().lower(),
    'interval_seconds': int(os.getenv('SEGMENT_INTERVAL_SECONDS', 900)),
    'airport_radius_km': float(os.getenv('AIRPORT_RADIUS_KM', 15.0)),
    'flight_timeout_seconds': int(os.getenv('FLIGHT_TIMEOUT_SECONDS', 1800)),
    'max_transition_gap_seconds': int(os.getenv('MAX_TRANSITION_GAP_SECONDS', 300)),
    'ground_glitch_max_seconds': int(os.getenv('GROUND_GLITCH_MAX_SECONDS', 60)),
    'allowed_lateness_seconds': int(os.getenv('ALLOWED_LATENESS_SECONDS', 120)),
    'bbox_lamin': float(os.getenv('OPENSKY_BBOX_LAMIN', 45.0)),
    'bbox_lomin': float(os.getenv('OPENSKY_BBOX_LOMIN', 5.0)),
    'bbox_lamax': float(os.getenv('OPENSKY_BBOX_LAMAX', 55.0)),
    'bbox_lomax': float(os.getenv('OPENSKY_BBOX_LOMAX', 25.0)),
    'bbox_exit_margin_km': float(os.getenv('BBOX_EXIT_MARGIN_KM', 25.0)),
    'driver_memory': os.getenv('SEGMENT_DRIVER_MEMORY', '4g'),
    'driver_memory_overhead': os.getenv('SEGMENT_DRIVER_MEMORY_OVERHEAD', '2g'),
    'executor_memory': os.getenv('SEGMENT_EXECUTOR_MEMORY', '4g'),
    'executor_cores': int(os.getenv('SEGMENT_EXECUTOR_CORES', 2)),
    'num_executors': int(os.getenv('SEGMENT_NUM_EXECUTORS', 2)),
    'shuffle_partitions': int(os.getenv('SEGMENT_SHUFFLE_PARTITIONS', 16)),
}

STREAMING_CONFIG = {
    'driver_memory': os.getenv('STREAMING_DRIVER_MEMORY', '3g'),
    'driver_memory_overhead': os.getenv('STREAMING_DRIVER_MEMORY_OVERHEAD', '2g'),
    'executor_memory': os.getenv('STREAMING_EXECUTOR_MEMORY', '4g'),
    'executor_cores': int(os.getenv('STREAMING_EXECUTOR_CORES', 2)),
    'num_executors': int(os.getenv('STREAMING_NUM_EXECUTORS', 4)),
    'shuffle_partitions': int(os.getenv('STREAMING_SHUFFLE_PARTITIONS', 32)),
    'trigger_seconds': int(os.getenv('STREAMING_TRIGGER_SECONDS', 15)),
    'max_rows_per_partition': int(
        os.getenv('STREAMING_MAX_ROWS_PER_PARTITION', 50_000)
    ),
}

AGGREGATE_CONFIG = {
    'window_seconds': int(os.getenv('DASHBOARD_WINDOW_SECONDS', 86400)),
    'position_freshness_seconds': int(os.getenv('POSITION_FRESHNESS_SECONDS', 900)),
    'interval_seconds': int(os.getenv('AGGREGATE_INTERVAL_SECONDS', 300)),
}

PATHS = {
    'discovery': os.getenv('YT_DISCOVERY_PATH', f"{TEAM_BASE_PATH}/spark/discovery"),
    'code': os.getenv('YT_CODE_PATH', f"{TEAM_BASE_PATH}/spark/code"),
    'checkpoints': os.getenv('YT_CHECKPOINT_PATH', f"{TEAM_BASE_PATH}/spark/checkpoints"),
    **table_paths(TEAM_BASE_PATH),
}
