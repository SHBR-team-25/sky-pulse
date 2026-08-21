import os
from dataclasses import dataclass


@dataclass(frozen=True)
class YtConfig:
    proxy: str
    token: str
    base_path: str
    positions_history_retention_seconds: int
    flights_segments_retention_seconds: int
    airport_events_retention_seconds: int
    dashboard_trend_retention_seconds: int
    queue_retained_lifetime_seconds: int


def _positive_seconds_env(name: str, default: int) -> int:
    value = int(os.getenv(name, default))
    if value <= 0:
        raise ValueError(f"{name} must be positive")
    return value


def load_yt_config() -> YtConfig:
    dashboard_window_seconds = int(os.getenv("DASHBOARD_WINDOW_SECONDS", 24 * 60 * 60))
    positions_history_retention_seconds = _positive_seconds_env(
        "POSITIONS_HISTORY_RETENTION_SECONDS", 10 * 60 * 60
    )
    window_table_retentions = {
        "FLIGHTS_SEGMENTS_RETENTION_SECONDS": _positive_seconds_env(
            "FLIGHTS_SEGMENTS_RETENTION_SECONDS", 2 * 24 * 60 * 60
        ),
        "AIRPORT_EVENTS_RETENTION_SECONDS": _positive_seconds_env(
            "AIRPORT_EVENTS_RETENTION_SECONDS", 2 * 24 * 60 * 60
        ),
        "DASHBOARD_TREND_RETENTION_SECONDS": _positive_seconds_env(
            "DASHBOARD_TREND_RETENTION_SECONDS", 2 * 24 * 60 * 60
        ),
    }
    for name, retention_seconds in window_table_retentions.items():
        if retention_seconds <= dashboard_window_seconds:
            raise ValueError(f"{name} must be greater than DASHBOARD_WINDOW_SECONDS")

    queue_retained_lifetime_seconds = int(os.getenv("QUEUE_RETAINED_LIFETIME_SECONDS", 3600))
    if queue_retained_lifetime_seconds < 0:
        raise ValueError("QUEUE_RETAINED_LIFETIME_SECONDS must not be negative")

    return YtConfig(
        proxy=os.environ["YT_PROXY"],
        token=os.environ["YT_TOKEN"],
        base_path=os.environ["YT_BASE_PATH"],
        positions_history_retention_seconds=positions_history_retention_seconds,
        flights_segments_retention_seconds=window_table_retentions[
            "FLIGHTS_SEGMENTS_RETENTION_SECONDS"
        ],
        airport_events_retention_seconds=window_table_retentions[
            "AIRPORT_EVENTS_RETENTION_SECONDS"
        ],
        dashboard_trend_retention_seconds=window_table_retentions[
            "DASHBOARD_TREND_RETENTION_SECONDS"
        ],
        queue_retained_lifetime_seconds=queue_retained_lifetime_seconds,
    )
