import os
import sys
import argparse
import subprocess
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))
from pipeline.spyt.config.spark_config import CLUSTER_CONFIG

def find_cluster_operation(proxy=None):
    proxy = proxy or os.getenv('YT_PROXY', CLUSTER_CONFIG['proxy'])
    
    cmd = [
        "yt", "list-operations", "--proxy", proxy,
        "--state", "running",
        "--user", os.getenv('YT_USER', '')
    ]
    
    try:
        result = subprocess.run(cmd, check=True, capture_output=True, text=True)
        for line in result.stdout.strip().split('\n'):
            if 'spark-launch' in line:
                parts = line.split()
                if parts:
                    return parts[0]
        return None
    except subprocess.CalledProcessError:
        return None

def stop_cluster(proxy=None, operation_id=None, force=False):
    proxy = proxy or os.getenv('YT_PROXY', CLUSTER_CONFIG['proxy'])
    
    if not operation_id:
        print("Searching for active cluster...")
        operation_id = find_cluster_operation(proxy)
    
    if not operation_id:
        print("No active cluster found")
        return False
    
    print(f"Found cluster: {operation_id}")
    
    if not force:
        response = input(f"Stop operation {operation_id}? (y/N): ")
        if response.lower() != 'y':
            print("Cancelled")
            return False
    
    cmd = ["yt", "abort-operation", "--proxy", proxy, operation_id]
    
    try:
        subprocess.run(cmd, check=True)
        print(f"Cluster {operation_id} stopped")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Failed to stop cluster: {e}")
        return False

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Stop Spark cluster')
    parser.add_argument('--proxy', help='YT cluster proxy')
    parser.add_argument('--operation-id', help='Operation ID to stop')
    parser.add_argument('-y', '--yes', action='store_true',
                       help='Confirm without prompt')
    args = parser.parse_args()
    
    stop_cluster(
        proxy=args.proxy,
        operation_id=args.operation_id,
        force=args.yes
    )