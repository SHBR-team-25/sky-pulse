import os
from dataclasses import dataclass


@dataclass(frozen=True)
class YtConfig:
    proxy: str
    token: str
    base_path: str
    data_retention_seconds: int
    queue_retained_lifetime_seconds: int


def load_yt_config() -> YtConfig:
    data_retention_seconds = int(os.getenv("DATA_RETENTION_SECONDS", 7 * 24 * 60 * 60))
    dashboard_window_seconds = int(os.getenv("DASHBOARD_WINDOW_SECONDS", 24 * 60 * 60))
    if data_retention_seconds <= dashboard_window_seconds:
        raise ValueError("DATA_RETENTION_SECONDS must be greater than DASHBOARD_WINDOW_SECONDS")

    queue_retained_lifetime_seconds = int(os.getenv("QUEUE_RETAINED_LIFETIME_SECONDS", 3600))
    if queue_retained_lifetime_seconds < 0:
        raise ValueError("QUEUE_RETAINED_LIFETIME_SECONDS must not be negative")

    return YtConfig(
        proxy=os.environ["YT_PROXY"],
        token=os.environ["YT_TOKEN"],
        base_path=os.environ["YT_BASE_PATH"],
        data_retention_seconds=data_retention_seconds,
        queue_retained_lifetime_seconds=queue_retained_lifetime_seconds,
    )
