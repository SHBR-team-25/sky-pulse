import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from pipeline.config import YT_PROXY, BASE_PATH

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
}

STREAMING_CONFIG = {
    'driver_memory': os.getenv('STREAMING_DRIVER_MEMORY', '2g'),
    'driver_memory_overhead': os.getenv('STREAMING_DRIVER_MEMORY_OVERHEAD', '1g'),
    'executor_memory': os.getenv('STREAMING_EXECUTOR_MEMORY', '4g'),
    'executor_cores': int(os.getenv('STREAMING_EXECUTOR_CORES', 2)),
    'num_executors': int(os.getenv('STREAMING_NUM_EXECUTORS', 2)),
    'shuffle_partitions': int(os.getenv('STREAMING_SHUFFLE_PARTITIONS', 8)),
    'trigger_seconds': int(os.getenv('STREAMING_TRIGGER_SECONDS', 30)),
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
    'positions_raw': os.getenv('YT_POSITIONS_RAW_PATH', f"{TEAM_BASE_PATH}/positions_raw"),
    'positions_raw_consumer': os.getenv(
        'YT_POSITIONS_RAW_CONSUMER_PATH', f"{TEAM_BASE_PATH}/positions_raw_consumer"
    ),
    'ref_aircraft': os.getenv('YT_REF_AIRCRAFT_PATH', f"{TEAM_BASE_PATH}/ref_aircraft"),
    'positions_current': os.getenv('YT_POSITIONS_CURRENT_PATH', f"{TEAM_BASE_PATH}/positions_current"),
    'positions_history': os.getenv('YT_POSITIONS_HISTORY_PATH', f"{TEAM_BASE_PATH}/positions_history"),
    'ref_airports': os.getenv('YT_REF_AIRPORTS_PATH', f"{TEAM_BASE_PATH}/ref_airports"),
    'flights_open': os.getenv('YT_FLIGHTS_OPEN_PATH', f"{TEAM_BASE_PATH}/flights_open"),
    'flights_segments': os.getenv('YT_FLIGHTS_SEGMENTS_PATH', f"{TEAM_BASE_PATH}/flights_segments"),
    'airport_events': os.getenv('YT_AIRPORT_EVENTS_PATH', f"{TEAM_BASE_PATH}/airport_events"),
    'dashboard_totals': os.getenv('YT_DASHBOARD_TOTALS_PATH', f"{TEAM_BASE_PATH}/dashboard_totals"),
    'dashboard_trend': os.getenv('YT_DASHBOARD_TREND_PATH', f"{TEAM_BASE_PATH}/dashboard_trend"),
    'dashboard_top_airports': os.getenv('YT_DASHBOARD_TOP_AIRPORTS_PATH', f"{TEAM_BASE_PATH}/dashboard_top_airports"),
    'dashboard_routes': os.getenv('YT_DASHBOARD_ROUTES_PATH', f"{TEAM_BASE_PATH}/dashboard_routes"),
    'dashboard_manufacturers': os.getenv('YT_DASHBOARD_MANUFACTURERS_PATH', f"{TEAM_BASE_PATH}/dashboard_manufacturers"),
    'pipeline_job_state': os.getenv('YT_PIPELINE_JOB_STATE_PATH', f"{TEAM_BASE_PATH}/pipeline_job_state"),
}
