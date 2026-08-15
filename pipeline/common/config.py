import os
from dataclasses import dataclass


@dataclass(frozen=True)
class YtConfig:
    proxy: str
    token: str
    base_path: str


def load_yt_config() -> YtConfig:
    return YtConfig(
        proxy=os.environ["YT_PROXY"],
        token=os.environ["YT_TOKEN"],
        base_path=os.environ["YT_BASE_PATH"],
    )
