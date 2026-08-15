import os
import subprocess
import sys
import time
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

    queue_path = f"{BASE_PATH}/positions_raw"
    consumer_path = f"{BASE_PATH}/positions_raw_consumer"

    if not client.exists(consumer_path):
        client.create("queue_consumer", consumer_path)
        print(f"Consumer created: {consumer_path}")

        print("Mounting consumer...")
        time.sleep(2)
        client.mount_table(consumer_path, sync=True)
        print(f"Consumer mounted: {consumer_path}")
    else:
        print(f"Consumer {consumer_path} already exists, skipping creation")

    env = os.environ.copy()
    env["YT_PROXY"] = args.proxy
    if args.token:
        env["YT_TOKEN"] = args.token

    subprocess.run(
        ["yt", "register-queue-consumer", queue_path, consumer_path, "--vital"],
        env=env,
        check=True,
    )
    print(f"Consumer {consumer_path} registered for queue {queue_path}")


if __name__ == "__main__":
    main()
