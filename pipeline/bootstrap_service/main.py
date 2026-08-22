import argparse
import logging

from bootstrap_service import (
    load_airport_events,
    load_dashboard_manufacturers,
    load_dashboard_routes,
    load_dashboard_top_airports,
    load_dashboard_totals,
    load_dashboard_trend,
    load_flights_open,
    load_flights_segments,
    load_pipeline_job_state,
    load_positions_current,
    load_positions_history,
    load_positions_raw_consumer,
    load_positions_table,
    load_ref_aircraft,
    load_ref_airports,
)

LOADERS = {
    "ref_aircraft": load_ref_aircraft,
    "ref_airports": load_ref_airports,
    "positions_raw": load_positions_table,
    "positions_current": load_positions_current,
    "positions_history": load_positions_history,
    "flights_open": load_flights_open,
    "flights_segments": load_flights_segments,
    "airport_events": load_airport_events,
    "dashboard_totals": load_dashboard_totals,
    "dashboard_trend": load_dashboard_trend,
    "dashboard_top_airports": load_dashboard_top_airports,
    "dashboard_routes": load_dashboard_routes,
    "dashboard_manufacturers": load_dashboard_manufacturers,
    "pipeline_job_state": load_pipeline_job_state,
    "positions_raw_consumer": load_positions_raw_consumer,
}


def main() -> None:
    parser = argparse.ArgumentParser(description="Bootstrap YT tables")
    parser.add_argument("--overwrite", action="store_true", help="Overwrite existing tables")
    parser.add_argument(
        "--tables",
        nargs="+",
        choices=LOADERS.keys(),
        help="Specific tables to create (default: all)",
    )
    parser.add_argument("--list", action="store_true", help="List available tables")
    args = parser.parse_args()

    if args.list:
        print("Available tables:")
        for name in sorted(LOADERS.keys()):
            print(f"  {name}")
        return

    logging.basicConfig(level=logging.INFO)

    # Определяем, какие таблицы создавать
    if args.tables:
        tables_to_load = args.tables
        print(f"Creating specific tables: {', '.join(tables_to_load)}")
    else:
        tables_to_load = list(LOADERS.keys())
        print("Creating all tables")

    for table_name in tables_to_load:
        loader = LOADERS[table_name]
        try:
            loader.load(overwrite=args.overwrite)
        except Exception as e:
            logging.error(f"Failed to create {table_name}: {e}")
            raise


if __name__ == "__main__":
    main()
