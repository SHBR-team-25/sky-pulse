import os
import sys
import argparse
import socket

import yt.wrapper as yt
from yt.wrapper import YtClient
from yt.wrapper.schema import TableSchema


DEFAULT_PROXY = "localhost:8000"


def get_table_info(table_path: str, proxy: str = DEFAULT_PROXY):
    if ":" in proxy:
        host, port_str = proxy.split(":")
        port = int(port_str)
    else:
        host = proxy
        port = 80

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
    print("")

    client = YtClient(proxy=proxy, config={"backend": "http"})

    if not client.exists(table_path):
        print(f"ERROR: Table {table_path} does not exist")
        sys.exit(1)

    print(f"Table: {table_path}")
    print("=" * 60)

    # Basic attributes
    attrs = [
        "type",
        "dynamic",
        "sorted",
        "row_count",
        "chunk_count",
        "compression_codec",
        "primary_medium",
        "account",
    ]

    for attr in attrs:
        try:
            value = client.get(f"{table_path}/@{attr}")
            print(f"{attr:20}: {value}")
        except Exception:
            print(f"{attr:20}: N/A")

    print("")

    # Key columns
    try:
        key_columns = client.get(f"{table_path}/@key_columns")
        if key_columns:
            print(f"Key columns: {', '.join(key_columns)}")
        else:
            print("Key columns: none (static table)")
    except Exception:
        print("Key columns: N/A")

    print("")

    # Tablet state (for dynamic tables)
    try:
        dynamic = client.get(f"{table_path}/@dynamic")
        if dynamic:
            tablet_state = client.get(f"{table_path}/@tablet_state")
            print(f"Tablet state: {tablet_state}")
            print(f"Tablet count: {client.get(f'{table_path}/@tablet_count')}")
    except Exception:
        pass

    print("")

    # Schema
    print("Schema:")
    print("-" * 40)
    try:
        schema = client.get(f"{table_path}/@schema")
        for col in schema:
            name = col.get("name", "?")
            required = "NOT NULL" if col.get("required", False) else "NULL"
            type_ = col.get("type_v3", col.get("type", "?"))
            if isinstance(type_, dict):
                type_name = type_.get("type_name", type_.get("item", "?"))
                if type_name == "optional":
                    type_ = f"optional<{type_.get('item', '?')}>"
                else:
                    type_ = str(type_)
            print(f"  {name:25} {type_:25} {required}")
    except Exception as e:
        print(f"  Error getting schema: {e}")


def main():
    parser = argparse.ArgumentParser(
        description="Get table information from YTsaurus"
    )
    parser.add_argument(
        "--table",
        required=True,
        help="Table path in YTsaurus (e.g. //home/ref_aircraft)"
    )
    parser.add_argument(
        "--proxy",
        default=os.environ.get("YT_PROXY", DEFAULT_PROXY),
        help=f"YTsaurus cluster proxy (default: {DEFAULT_PROXY})"
    )
    args = parser.parse_args()
    get_table_info(args.table, args.proxy)


if __name__ == "__main__":
    main()