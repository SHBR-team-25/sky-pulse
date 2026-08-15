from typing import Any

import yt.wrapper as yt


def create_table_safely(
    client: yt.YtClient,
    path: str,
    schema: list[dict[str, Any]],
    overwrite: bool,
) -> None:
    if client.exists(path) and not overwrite:
        raise RuntimeError(f"Table {path} already exists. Pass overwrite=True to replace it.")

    client.create("table", path, attributes={"schema": schema}, recursive=True, force=True)
