import csv
from collections.abc import Iterator

import requests


def iter_csv_rows(url: str) -> Iterator[dict[str, str]]:
    response = requests.get(url, stream=True, timeout=60)
    response.raise_for_status()
    lines = (line.decode("utf-8") for line in response.iter_lines() if line)
    yield from csv.DictReader(lines)
