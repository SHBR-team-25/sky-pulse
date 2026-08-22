import time
from typing import Any

ICAO24 = 0
CALLSIGN = 1
ORIGIN_COUNTRY = 2
TIME_POSITION = 3
LAST_CONTACT = 4
LONGITUDE = 5
LATITUDE = 6
BARO_ALTITUDE = 7
ON_GROUND = 8
VELOCITY = 9
TRUE_TRACK = 10
VERTICAL_RATE = 11
GEO_ALTITUDE = 13
SQUAWK = 14
SPI = 15
POSITION_SOURCE = 16
CATEGORY = 17

KNOWN_NON_AIRPLANE_CATEGORIES = frozenset(range(8, 21))


def _to_float(value: Any) -> float | None:
    if value is None:
        return None
    return float(value)


def _aircraft_category_allowed(category: Any) -> bool:
    return category is None or (
        isinstance(category, int) and category not in KNOWN_NON_AIRPLANE_CATEGORIES
    )


def summarize_state_categories(response: dict[str, Any]) -> str:
    counts: dict[Any, int] = {}
    invalid_position = 0

    for state in response.get("states") or []:
        category = state[CATEGORY] if len(state) > CATEGORY else None
        counts[category] = counts.get(category, 0) + 1
        if (
            len(state) <= LONGITUDE
            or state[TIME_POSITION] is None
            or state[LATITUDE] is None
            or state[LONGITUDE] is None
        ):
            invalid_position += 1

    parts = [f"null={counts.pop(None, 0)}"]
    parts.extend(f"{category}={counts.pop(category, 0)}" for category in range(21))
    if counts:
        unexpected = sorted((f"{category!r}:{count}" for category, count in counts.items()))
        parts.append(f"unexpected={','.join(unexpected)}")
    parts.append(f"invalid_position={invalid_position}")
    return " ".join(parts)


def to_positions_raw_rows(response: dict[str, Any]) -> list[dict[str, Any]]:
    snapshot_time = response["time"]
    ingested_at = int(time.time())

    rows = []
    for state in response["states"] or []:
        category = state[CATEGORY] if len(state) > CATEGORY else None
        if not _aircraft_category_allowed(category):
            continue
        if state[TIME_POSITION] is None or state[LATITUDE] is None or state[LONGITUDE] is None:
            continue

        rows.append(
            {
                "icao24": state[ICAO24],
                "time_position": state[TIME_POSITION],
                "callsign": (state[CALLSIGN] or "").strip() or None,
                "origin_country": state[ORIGIN_COUNTRY],
                "last_contact": state[LAST_CONTACT],
                "lat": _to_float(state[LATITUDE]),
                "lon": _to_float(state[LONGITUDE]),
                "baro_altitude": _to_float(state[BARO_ALTITUDE]),
                "geo_altitude": _to_float(state[GEO_ALTITUDE]),
                "on_ground": state[ON_GROUND],
                "velocity": _to_float(state[VELOCITY]),
                "true_track": _to_float(state[TRUE_TRACK]),
                "vertical_rate": _to_float(state[VERTICAL_RATE]),
                "squawk": state[SQUAWK],
                "spi": state[SPI],
                "position_source": state[POSITION_SOURCE],
                "category": category,
                "snapshot_time": snapshot_time,
                "ingested_at": ingested_at,
            }
        )
    return rows
