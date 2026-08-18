from typing import Any

import yt.wrapper as yt


def ensure_table(
    client: yt.YtClient,
    path: str,
    schema: list[dict[str, Any]],
    overwrite: bool,
    dynamic: bool = False,
) -> bool:
    if client.exists(path) and not overwrite:
        return False

    attributes: dict[str, Any] = {"schema": schema}
    if dynamic:
        attributes["dynamic"] = True
        attributes["primary_medium"] = "default"

    client.create("table", path, attributes=attributes, recursive=True, force=True)
    return True
