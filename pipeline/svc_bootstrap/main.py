import argparse
import logging

from svc_bootstrap import load_ref_aircraft, load_ref_airports


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--overwrite", action="store_true")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO)
    load_ref_aircraft.load(overwrite=args.overwrite)
    load_ref_airports.load(overwrite=args.overwrite)


if __name__ == "__main__":
    main()
