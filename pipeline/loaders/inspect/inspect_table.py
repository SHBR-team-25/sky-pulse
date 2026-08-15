import os
import sys
import argparse
import subprocess


DEFAULT_PROXY = "localhost:8000"

TABLE_PATHS = {
    "ref_aircraft": "//home/ref_aircraft",
    "ref_airports": "//home/ref_airports",
    "positions_raw": "//home/positions_raw",
    "positions_current": "//home/positions_current",
    "positions_history": "//home/positions_history",
}


def inspect_table(table_name: str, proxy: str = DEFAULT_PROXY):
    if table_name not in TABLE_PATHS:
        print(f"ERROR: Unknown table: {table_name}")
        print(f"Available tables: {', '.join(TABLE_PATHS.keys())}")
        sys.exit(1)

    table_path = TABLE_PATHS[table_name]

    script_dir = os.path.dirname(os.path.abspath(__file__))
    script_path = os.path.join(script_dir, "table_info.py")

    print(f"\n>>> Table: {table_name} ({table_path})")
    print("=" * 80)

    try:
        result = subprocess.run(
            [sys.executable, script_path, "--table", table_path, "--proxy", proxy],
            capture_output=False,
            text=True,
            check=False
        )

        if result.returncode != 0:
            print(f"ERROR: Failed to inspect {table_name}")

    except Exception as e:
        print(f"ERROR: {e}")


def main():
    parser = argparse.ArgumentParser(
        description="Inspect a single table in YTsaurus"
    )
    parser.add_argument(
        "--table",
        required=True,
        help=f"Table name. Available: {', '.join(TABLE_PATHS.keys())}"
    )
    parser.add_argument(
        "--proxy",
        default=os.environ.get("YT_PROXY", DEFAULT_PROXY),
        help=f"YTsaurus cluster proxy (default: {DEFAULT_PROXY})"
    )
    args = parser.parse_args()
    inspect_table(args.table, args.proxy)


if __name__ == "__main__":
    main()