from typing import Any

import yt.wrapper as yt


def ensure_table(
    client: yt.YtClient,
    path: str,
    schema: list[dict[str, Any]],
    overwrite: bool,
) -> bool:
    if client.exists(path) and not overwrite:
        return False

    client.create("table", path, attributes={"schema": schema}, recursive=True, force=True)
    return True
