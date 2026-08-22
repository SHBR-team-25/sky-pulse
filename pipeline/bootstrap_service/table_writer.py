from typing import Any

import yt.wrapper as yt


def ensure_table(
    client: yt.YtClient,
    path: str,
    schema: list[dict[str, Any]],
    overwrite: bool,
    dynamic: bool = False,
    is_consumer: bool = False,
    max_data_ttl_ms: int | None = None,
    auto_trim_config: dict[str, Any] | None = None,
) -> bool:
    if client.exists(path) and not overwrite:
        return False

    attributes: dict[str, Any] = {"schema": schema}
    if dynamic:
        attributes["dynamic"] = True
        attributes["primary_medium"] = "default"
    if is_consumer:
        attributes["treat_as_queue_consumer"] = True
    if max_data_ttl_ms is not None:
        attributes["max_data_ttl"] = max_data_ttl_ms
        attributes["min_data_versions"] = 0
    if auto_trim_config is not None:
        attributes["auto_trim_config"] = auto_trim_config

    client.create("table", path, attributes=attributes, recursive=True, force=True)
    return True


def ensure_consumer_registration(
    client: yt.YtClient,
    queue_path: str,
    consumer_path: str,
    vital: bool = False,
) -> bool:
    registrations = client.list_queue_consumer_registrations(queue_path)
    for reg in registrations:
        if reg.get("consumer_path") == consumer_path:
            return False

    client.register_queue_consumer(queue_path, consumer_path, vital=vital)
    return True
