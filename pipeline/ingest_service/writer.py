from typing import Any

import yt.wrapper as yt

# Глобальный снапшот — 10-15 тысяч строк, одним insert_rows это упирается
# в лимит размера запроса.
_CHUNK_SIZE = 1000


def write_rows(client: yt.YtClient, table_path: str, rows: list[dict[str, Any]]) -> None:
    for start in range(0, len(rows), _CHUNK_SIZE):
        client.insert_rows(table_path, rows[start : start + _CHUNK_SIZE])
