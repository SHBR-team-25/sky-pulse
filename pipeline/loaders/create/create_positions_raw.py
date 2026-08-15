import os
import sys
import time
import argparse
import socket
import logging

import yt.wrapper as yt
from yt.wrapper import YtClient
from yt.wrapper.schema import TableSchema
from yt.type_info import typing as ti

DEFAULT_PROXY = "localhost:8000"
TABLE_PATH = "//home/positions_raw"

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def get_schema():
    return TableSchema() \
        .add_column("icao24", ti.String, sort_order="ascending") \
        .add_column("time_position", ti.Int64, sort_order="ascending") \
        .add_column("callsign", ti.Optional[ti.String]) \
        .add_column("origin_country", ti.String) \
        .add_column("last_contact", ti.Int64) \
        .add_column("lat", ti.Double) \
        .add_column("lon", ti.Double) \
        .add_column("baro_altitude", ti.Optional[ti.Double]) \
        .add_column("geo_altitude", ti.Optional[ti.Double]) \
        .add_column("on_ground", ti.Bool) \
        .add_column("velocity", ti.Optional[ti.Double]) \
        .add_column("true_track", ti.Optional[ti.Double]) \
        .add_column("vertical_rate", ti.Optional[ti.Double]) \
        .add_column("squawk", ti.Optional[ti.String]) \
        .add_column("spi", ti.Bool) \
        .add_column("position_source", ti.Int64) \
        .add_column("category", ti.Optional[ti.Int64]) \
        .add_column("snapshot_time", ti.Int64) \
        .add_column("ingested_at", ti.Int64)

def create_table(proxy: str = DEFAULT_PROXY):
    if ":" in proxy:
        host, port_str = proxy.split(":")
        port = int(port_str)
    else:
        host = proxy
        port = 80

    logger.info(f"Checking connection to {proxy}...")
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(2)
        result = sock.connect_ex((host, port))
        sock.close()
        if result != 0:
            logger.error(f"Cannot connect to YTsaurus at {proxy}")
            sys.exit(1)
    except Exception as e:
        logger.error(f"Connection error: {e}")
        sys.exit(1)

    logger.info(f"Connected to: {proxy}")

    client = YtClient(proxy=proxy, config={"backend": "http"})

    try:
        if not client.exists("//home"):
            client.create("map_node", "//home", recursive=True)
            logger.info("Created //home directory")
    except Exception as e:
        logger.warning(f"Could not check/create //home: {e}")

    if client.exists(TABLE_PATH):
        logger.info(f"Table {TABLE_PATH} already exists, skipping")
        return

    try:
        logger.info(f"Creating table: {TABLE_PATH}")
        client.create(
            "table",
            TABLE_PATH,
            attributes={
                "schema": get_schema().to_yson_type(),
                "dynamic": True,
                "primary_medium": "default"
            }
        )
        logger.info(f"Table {TABLE_PATH} created")

        logger.info("Mounting table...")
        time.sleep(2)
        client.mount_table(TABLE_PATH, sync=True)
        logger.info(f"Table {TABLE_PATH} mounted")

    except Exception as e:
        logger.error(f"Failed to create table {TABLE_PATH}: {e}")
        sys.exit(1)

    try:
        dynamic = client.get(f"{TABLE_PATH}/@dynamic")
        tablet_state = client.get(f"{TABLE_PATH}/@tablet_state")
        logger.info(f"Verification: dynamic={dynamic}, state={tablet_state}")
        if tablet_state != "mounted":
            logger.warning(f"Table not mounted, state: {tablet_state}")
        else:
            logger.info("Table created and mounted successfully")
    except Exception as e:
        logger.error(f"Failed to verify table: {e}")

def main():
    parser = argparse.ArgumentParser(
        description="Create positions_raw queue table in YTsaurus"
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