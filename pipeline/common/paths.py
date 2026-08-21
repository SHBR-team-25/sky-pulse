"""Canonical YTsaurus paths used by every pipeline service."""

import os

_TABLE_PATHS = {
    "positions_raw": ("YT_POSITIONS_RAW_PATH", "raw/positions_raw"),
    "positions_raw_consumer": (
        "YT_POSITIONS_RAW_CONSUMER_PATH",
        "raw/positions_raw_consumer",
    ),
    "ref_aircraft": ("YT_REF_AIRCRAFT_PATH", "reference/ref_aircraft"),
    "ref_airports": ("YT_REF_AIRPORTS_PATH", "reference/ref_airports"),
    "positions_current": ("YT_POSITIONS_CURRENT_PATH", "positions/positions_current"),
    "positions_history": ("YT_POSITIONS_HISTORY_PATH", "positions/positions_history"),
    "flights_open": ("YT_FLIGHTS_OPEN_PATH", "flights/flights_open"),
    "flights_segments": ("YT_FLIGHTS_SEGMENTS_PATH", "flights/flights_segments"),
    "airport_events": ("YT_AIRPORT_EVENTS_PATH", "flights/airport_events"),
    "dashboard_totals": ("YT_DASHBOARD_TOTALS_PATH", "dashboard/dashboard_totals"),
    "dashboard_trend": ("YT_DASHBOARD_TREND_PATH", "dashboard/dashboard_trend"),
    "dashboard_top_airports": (
        "YT_DASHBOARD_TOP_AIRPORTS_PATH",
        "dashboard/dashboard_top_airports",
    ),
    "dashboard_routes": ("YT_DASHBOARD_ROUTES_PATH", "dashboard/dashboard_routes"),
    "dashboard_manufacturers": (
        "YT_DASHBOARD_MANUFACTURERS_PATH",
        "dashboard/dashboard_manufacturers",
    ),
    "pipeline_job_state": ("YT_PIPELINE_JOB_STATE_PATH", "system/pipeline_job_state"),
}


def table_path(base_path: str, name: str) -> str:
    """Return an environment override or the canonical path below ``base_path``."""
    env_name, relative_path = _TABLE_PATHS[name]
    return os.getenv(env_name, f"{base_path.rstrip('/')}/{relative_path}")


def table_paths(base_path: str) -> dict[str, str]:
    return {name: table_path(base_path, name) for name in _TABLE_PATHS}
