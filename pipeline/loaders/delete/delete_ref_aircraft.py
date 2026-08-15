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
    parser.add_argument("-y", "--yes", action="store_true")
    args = parser.parse_args()
    
    client = YtClient(proxy=args.proxy, config={"backend": "http"})
    
    table_path = f"{BASE_PATH}/ref_aircraft"
    
    if not client.exists(table_path):
        print(f"Table {table_path} does not exist")
        return
    
    print(f"Table: {table_path}")
    print("Type: static")
    print("Key: icao24")
    
    if not args.yes:
        response = input(f"\nDelete table {table_path}? (yes/no): ")
        if response.lower() != "yes":
            print("Aborted")
            return
    
    try:
        client.remove(table_path, recursive=True)
        print(f"Table {table_path} deleted")
    except Exception as e:
        print(f"ERROR: Failed to delete table: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()