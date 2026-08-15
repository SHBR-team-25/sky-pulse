import yt.wrapper as yt
import sys
import argparse
from pathlib import Path
from yt.wrapper import YtClient

sys.path.insert(0, str(Path(__file__).parent.parent.parent))
from config import BASE_PATH, YT_PROXY

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--proxy", default=YT_PROXY)
    args = parser.parse_args()
    
    client = YtClient(proxy=args.proxy, config={"backend": "http"})
    
    table_path = f"{BASE_PATH}/ref_aircraft"
    schema = [
        {"name": "icao24", "type": "string", "sort_order": "ascending"},
        {"name": "registration", "type": "string"},
        {"name": "type", "type": "string"},
        {"name": "manufacturer", "type": "string"},
        {"name": "model", "type": "string"},
    ]
    
    if client.exists(table_path):
        print(f"Table {table_path} already exists, skipping")
        return
    
    client.create("table", table_path, attributes={"schema": schema, "dynamic": True})
    print(f"Table created: {table_path}")

if __name__ == "__main__":
    main()