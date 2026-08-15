from typing import Any

import yt.wrapper as yt


def write_rows(client: yt.YtClient, table_path: str, rows: list[dict[str, Any]]) -> None:
    if not rows:
        return
    client.insert_rows(table_path, rows)
