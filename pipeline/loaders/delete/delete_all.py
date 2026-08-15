import os
import sys
import argparse
import subprocess
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))
from config import BASE_PATH, YT_PROXY

TABLES = [
    ("ref_aircraft", "static", "icao24"),
    ("ref_airports", "static", "ident"),
    ("positions_raw", "dynamic, sorted", "(icao24, time_position)"),
    ("positions_current", "dynamic, sorted", "icao24"),
    ("positions_history", "dynamic, sorted", "(icao24, time_position)"),
]

DELETE_SCRIPTS = [
    "delete_ref_aircraft.py",
    "delete_ref_airports.py",
    "delete_positions_raw.py",
    "delete_positions_current.py",
    "delete_positions_history.py",
]

def delete_all_tables(proxy: str = None, force: bool = False):
    proxy = proxy or YT_PROXY
    print("=" * 80)
    print("DELETE ALL TABLES")
    print("=" * 80)
    print(f"Proxy: {proxy}")
    print(f"Base path: {BASE_PATH}")
    print("")

    print("Tables to be deleted:")
    for name, type_, key in TABLES:
        print(f"  {BASE_PATH}/{name} ({type_}, key: {key})")
    print("")

    if not force:
        response = input("Delete ALL tables? (yes/no): ")
        if response.lower() != "yes":
            print("Aborted")
            return

    script_dir = os.path.dirname(os.path.abspath(__file__))
    failed = []

    for script in DELETE_SCRIPTS:
        script_path = os.path.join(script_dir, script)

        print(f"\n>>> Running: {script}")
        print("-" * 40)

        try:
            result = subprocess.run(
                [sys.executable, script_path, "--proxy", proxy, "-y"],
                capture_output=False,
                text=True,
                check=False
            )

            if result.returncode != 0:
                print(f"ERROR: {script} failed with code {result.returncode}")
                failed.append(script)
            else:
                print(f"SUCCESS: {script} completed")

        except Exception as e:
            print(f"ERROR: Failed to run {script}: {e}")
            failed.append(script)

    print("")
    print("=" * 80)
    print("SUMMARY")
    print("=" * 80)

    if failed:
        print(f"FAILED: {', '.join(failed)}")
        sys.exit(1)
    else:
        print("SUCCESS: All tables deleted")

def main():
    parser = argparse.ArgumentParser(
        description="Delete all tables from YTsaurus"
    )
    parser.add_argument(
        "-y", "--yes",
        action="store_true",
        help="Skip confirmation prompt"
    )
    parser.add_argument(
        "--proxy",
        default=os.environ.get("YT_PROXY", YT_PROXY),
        help=f"YTsaurus cluster proxy (default: {YT_PROXY})"
    )
    args = parser.parse_args()
    delete_all_tables(args.proxy, args.yes)

if __name__ == "__main__":
    main()