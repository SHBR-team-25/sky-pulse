import yt.wrapper as yt

from common.config import YtConfig


def make_client(config: YtConfig) -> yt.YtClient:
    return yt.YtClient(proxy=config.proxy, token=config.token)
