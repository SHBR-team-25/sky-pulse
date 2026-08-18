import os
import sys
import argparse
import subprocess
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))
from pipeline.spyt.config.spark_config import CLUSTER_CONFIG, PATHS

def check_cluster(proxy=None, discovery_path=None):
    proxy = proxy or os.getenv('YT_PROXY', CLUSTER_CONFIG['proxy'])
    discovery_path = discovery_path or PATHS['discovery']
    
    print(f"Checking cluster status:")
    print(f"  Proxy: {proxy}")
    print(f"  Discovery path: {discovery_path}\n")
    
    # Check if discovery path exists
    cmd_check = ["yt", "exists", "--proxy", proxy, discovery_path]
    
    try:
        result = subprocess.run(cmd_check, check=True, capture_output=True, text=True)
        if "true" in result.stdout.lower():
            print("Discovery path exists")
            
            # List contents
            cmd_list = ["yt", "list", "--proxy", proxy, discovery_path]
            result = subprocess.run(cmd_list, check=True, capture_output=True, text=True)
            print("Discovery path contents:")
            for item in result.stdout.strip().split('\n'):
                if item:
                    print(f"  - {item}")
        else:
            print("Discovery path does not exist")
            return False
    except subprocess.CalledProcessError as e:
        print(f"Check failed: {e}")
        return False
    
    # Check running operations
    cmd_ops = [
        "yt", "list-operations", "--proxy", proxy,
        "--state", "running",
        "--user", os.getenv('YT_USER', '')
    ]
    
    try:
        result = subprocess.run(cmd_ops, check=True, capture_output=True, text=True)
        if result.stdout.strip():
            print("\nActive YTsaurus operations:")
            for line in result.stdout.strip().split('\n'):
                if 'spark-launch' in line or 'spark-submit' in line:
                    print(f"  {line}")
        else:
            print("\nNo active operations")
    except subprocess.CalledProcessError as e:
        print(f"Failed to get operations: {e}")
    
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Check cluster status')
    parser.add_argument('--proxy', help='YT cluster proxy')
    parser.add_argument('--discovery-path', help='Discovery path')
    args = parser.parse_args()
    
    check_cluster(proxy=args.proxy, discovery_path=args.discovery_path)