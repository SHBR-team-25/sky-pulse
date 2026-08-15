import os
import sys
import argparse
import subprocess
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))
from config import BASE_PATH, YT_PROXY

SCRIPTS = [
    "create_ref_aircraft.py",
    "create_ref_airports.py",
    "create_positions_raw.py",
    "create_positions_current.py",
    "create_positions_history.py",
]

def create_all_tables(proxy: str = None):
    proxy = proxy or YT_PROXY
    print("=" * 80)
    print("CREATING ALL TABLES")
    print("=" * 80)
    print(f"Proxy: {proxy}")
    print(f"Base path: {BASE_PATH}")
    print("")

    script_dir = os.path.dirname(os.path.abspath(__file__))
    failed = []

    for script in SCRIPTS:
        script_path = os.path.join(script_dir, script)

        print(f"\n>>> Running: {script}")
        print("-" * 40)

        try:
            result = subprocess.run(
                [sys.executable, script_path, "--proxy", proxy],
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
        print("SUCCESS: All tables created")
        print("")
        print(f"Tables created under {BASE_PATH}:")
        print(f"  {BASE_PATH}/ref_aircraft (static)")
        print(f"  {BASE_PATH}/ref_airports (static)")
        print(f"  {BASE_PATH}/positions_raw (dynamic, mounted)")
        print(f"  {BASE_PATH}/positions_current (dynamic, mounted)")
        print(f"  {BASE_PATH}/positions_history (dynamic, mounted)")

def main():
    parser = argparse.ArgumentParser(
        description="Create all tables in YTsaurus"
    )
    parser.add_argument(
        "--proxy",
        default=os.environ.get("YT_PROXY", YT_PROXY),
        help=f"YTsaurus cluster proxy (default: {YT_PROXY})"
    )
    args = parser.parse_args()
    create_all_tables(args.proxy)

if __name__ == "__main__":
    main()