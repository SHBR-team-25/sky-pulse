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
    'airport_radius_km': float(os.getenv('AIRPORT_RADIUS_KM', 15.0)),
    'flight_timeout_seconds': int(os.getenv('FLIGHT_TIMEOUT_SECONDS', 1800)),
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
