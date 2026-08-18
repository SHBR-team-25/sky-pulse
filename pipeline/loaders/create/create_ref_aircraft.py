import os
import yt.wrapper as yt
import sys
import argparse
from pathlib import Path
from yt.wrapper import YtClient

sys.path.insert(0, str(Path(__file__).parent.parent.parent))
from config import BASE_PATH, YT_PROXY

BASE_PATH = os.getenv("YT_BASE_PATH", BASE_PATH)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--proxy", default=YT_PROXY)
    parser.add_argument("--token", default=os.getenv("YT_TOKEN"))
    args = parser.parse_args()
    
    client = YtClient(proxy=args.proxy, token=args.token or None, config={"backend": "http"})
    
    table_path = f"{BASE_PATH}/ref_aircraft"
    schema = [
        {"name": "icao24", "type": "string", "sort_order": "ascending"},
        {"name": "registration", "type": "string"},
        {"name": "manufacturername", "type": "string"},
        {"name": "model", "type": "string"},
        {"name": "typecode", "type": "string"},
        {"name": "operator", "type": "string"},
        {"name": "operatorcallsign", "type": "string"},
        {"name": "operatoricao", "type": "string"},
        {"name": "owner", "type": "string"},
        {"name": "categoryDescription", "type": "string"},
    ]
    
    if client.exists(table_path):
        print(f"Table {table_path} already exists, skipping")
        return
    
    client.create("table", table_path, attributes={"schema": schema})
    print(f"Table created: {table_path}")

if __name__ == "__main__":
    main()