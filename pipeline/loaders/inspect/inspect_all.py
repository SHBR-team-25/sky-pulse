import os
import sys
import argparse
import subprocess
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))
from config import BASE_PATH, YT_PROXY

TABLES = [
    f"{BASE_PATH}/ref_aircraft",
    f"{BASE_PATH}/ref_airports",
    f"{BASE_PATH}/positions_raw",
    f"{BASE_PATH}/positions_current",
    f"{BASE_PATH}/positions_history",
]

def inspect_all_tables(proxy: str = None):
    proxy = proxy or YT_PROXY
    print("=" * 80)
    print("INSPECT ALL TABLES")
    print("=" * 80)
    print(f"Proxy: {proxy}")
    print(f"Base path: {BASE_PATH}")
    print("")

    script_dir = os.path.dirname(os.path.abspath(__file__))
    script_path = os.path.join(script_dir, "table_info.py")

    for table in TABLES:
        print(f"\n>>> Table: {table}")
        print("=" * 80)

        try:
            result = subprocess.run(
                [sys.executable, script_path, "--table", table, "--proxy", proxy],
                capture_output=False,
                text=True,
                check=False
            )

            if result.returncode != 0:
                print(f"ERROR: Failed to inspect {table}")

        except Exception as e:
            print(f"ERROR: {e}")

    print("")
    print("=" * 80)
    print("INSPECTION COMPLETE")
    print("=" * 80)

def main():
    parser = argparse.ArgumentParser(
        description="Inspect all tables in YTsaurus"
    )
    parser.add_argument(
        "--proxy",
        default=os.environ.get("YT_PROXY", YT_PROXY),
        help=f"YTsaurus cluster proxy (default: {YT_PROXY})"
    )
    args = parser.parse_args()
    inspect_all_tables(args.proxy)

if __name__ == "__main__":
    main()