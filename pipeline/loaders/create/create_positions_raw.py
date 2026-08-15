import yt.wrapper as yt
import sys
import time
import argparse
from pathlib import Path
from yt.wrapper import YtClient

sys.path.append(str(Path(__file__).parent.parent))
from config import BASE_PATH, YT_PROXY

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--proxy", default=YT_PROXY)
    args = parser.parse_args()
    
    client = YtClient(proxy=args.proxy, config={"backend": "http"})
    
    table_path = f"{BASE_PATH}/positions_raw"
    schema = [
        {"name": "icao24", "type": "string", "sort_order": "ascending"},
        {"name": "time_position", "type": "int64", "sort_order": "ascending"},
        {"name": "callsign", "type": "string"},
        {"name": "origin_country", "type": "string"},
        {"name": "last_contact", "type": "int64"},
        {"name": "lat", "type": "double"},
        {"name": "lon", "type": "double"},
        {"name": "baro_altitude", "type": "double"},
        {"name": "geo_altitude", "type": "double"},
        {"name": "on_ground", "type": "boolean"},
        {"name": "velocity", "type": "double"},
        {"name": "true_track", "type": "double"},
        {"name": "vertical_rate", "type": "double"},
        {"name": "squawk", "type": "string"},
        {"name": "spi", "type": "boolean"},
        {"name": "position_source", "type": "int64"},
        {"name": "category", "type": "int64"},
        {"name": "snapshot_time", "type": "int64"},
        {"name": "ingested_at", "type": "int64"},
    ]
    
    if client.exists(table_path):
        print(f"Table {table_path} already exists, skipping")
        return
    
    client.create("table", table_path, attributes={
        "schema": schema,
        "dynamic": True,
        "primary_medium": "default"
    })
    print(f"Table created: {table_path}")
    
    print("Mounting table...")
    time.sleep(2)
    client.mount_table(table_path, sync=True)
    print(f"Table mounted: {table_path}")

if __name__ == "__main__":
    main()