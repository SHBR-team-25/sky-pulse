import os
import sys
import argparse
import socket

import yt.wrapper as yt
from yt.wrapper import YtClient
from yt.wrapper.schema import TableSchema
from yt.type_info import typing as ti


DEFAULT_PROXY = "localhost:8000"
TABLE_PATH = "//home/ref_airports"


def get_schema():
    return TableSchema() \
        .add_column("ident", ti.String) \
        .add_column("icao_code", ti.Optional[ti.String]) \
        .add_column("iata_code", ti.Optional[ti.String]) \
        .add_column("name", ti.String) \
        .add_column("type", ti.String) \
        .add_column("municipality", ti.Optional[ti.String]) \
        .add_column("iso_country", ti.Optional[ti.String]) \
        .add_column("latitude_deg", ti.Double) \
        .add_column("longitude_deg", ti.Double)


def create_table(proxy: str = DEFAULT_PROXY):
    # Parse host and port
    if ":" in proxy:
        host, port_str = proxy.split(":")
        port = int(port_str)
    else:
        host = proxy
        port = 80

    # Check connection
    print(f"Checking connection to {proxy}...")
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(2)
        result = sock.connect_ex((host, port))
        sock.close()
        if result != 0:
            print(f"ERROR: Cannot connect to YTsaurus at {proxy}")
            sys.exit(1)
    except Exception as e:
        print(f"ERROR: {e}")
        sys.exit(1)

    print(f"Connected to: {proxy}")

    client = YtClient(proxy=proxy, config={"backend": "http"})

    # Check home exists
    try:
        if not client.exists("//home"):
            client.create("map_node", "//home", recursive=True)
            print("Created //home directory")
    except Exception as e:
        print(f"Warning: Could not check/create //home: {e}")

    # Create table
    if client.exists(TABLE_PATH):
        print(f"Table {TABLE_PATH} already exists, skipping")
        return

    try:
        client.create(
            "table",
            TABLE_PATH,
            attributes={"schema": get_schema().to_yson_type()}
        )
        print(f"Table {TABLE_PATH} created")
    except Exception as e:
        print(f"Error creating {TABLE_PATH}: {e}")
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description="Create ref_airports table in YTsaurus"
    )
    parser.add_argument(
        "--proxy",
        default=os.environ.get("YT_PROXY", DEFAULT_PROXY),
        help=f"YTsaurus cluster proxy (default: {DEFAULT_PROXY})"
    )
    args = parser.parse_args()
    create_table(args.proxy)


if __name__ == "__main__":
    main()