import os
import sys
import argparse
import socket

import yt.wrapper as yt
from yt.wrapper import YtClient


DEFAULT_PROXY = "localhost:8000"
TABLE_PATH = "//home/positions_raw"


def delete_table(proxy: str = DEFAULT_PROXY, force: bool = False):
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

    client = YtClient(proxy=proxy, config={"backend": "http"})

    if not client.exists(TABLE_PATH):
        print(f"Table {TABLE_PATH} does not exist")
        return

    print(f"Table: {TABLE_PATH}")
    print("Type: dynamic, sorted")
    print("Key: (icao24, time_position)")
    print("Status: mounted")

    if not force:
        response = input(f"\nDelete table {TABLE_PATH}? (yes/no): ")
        if response.lower() != "yes":
            print("Aborted")
            return

    try:
        # Unmount before deletion
        try:
            print("Unmounting table...")
            client.unmount_table(TABLE_PATH, sync=True)
            print("Table unmounted")
        except Exception as e:
            print(f"Warning: Could not unmount table: {e}")

        client.remove(TABLE_PATH, recursive=True)
        print(f"Table {TABLE_PATH} deleted")
    except Exception as e:
        print(f"ERROR: Failed to delete table: {e}")
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description=f"Delete {TABLE_PATH} table from YTsaurus"
    )
    parser.add_argument(
        "-y", "--yes",
        action="store_true",
        help="Skip confirmation prompt"
    )
    parser.add_argument(
        "--proxy",
        default=os.environ.get("YT_PROXY", DEFAULT_PROXY),
        help=f"YTsaurus cluster proxy (default: {DEFAULT_PROXY})"
    )
    args = parser.parse_args()
    delete_table(args.proxy, args.yes)


if __name__ == "__main__":
    main()