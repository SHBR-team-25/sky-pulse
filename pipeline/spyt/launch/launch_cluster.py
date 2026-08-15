import os
import sys
import argparse
import subprocess
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from pipeline.spyt.config.spark_config import CLUSTER_CONFIG, PATHS

def ensure_spyt_directories(proxy, spyt_version="2.4.0"):
    """Create required SPYT directories in YTsaurus"""
    from yt.wrapper import YtClient
    
    client = YtClient(proxy=proxy, config={"backend": "http"})
    
    paths = [
        "//home/spark",
        "//home/spark/conf",
        "//home/spark/conf/releases",
        "//home/spark/discovery",
        "//home/spark/code",
        "//home/spark/checkpoints",
    ]
    
    print("Checking SPYT directories...")
    for path in paths:
        if not client.exists(path):
            client.create("map_node", path, recursive=True)
            print(f"  Created: {path}")
        else:
            print(f"  Exists: {path}")
    
    # Create global config file if not exists
    global_conf_path = "//home/spark/conf/global"
    if not client.exists(global_conf_path):
        print(f"  Creating global config: {global_conf_path}")
        client.create("document", global_conf_path, attributes={
            "value": {
                "spark_yt_version": spyt_version,
                "spark_version": "2.4.0"
            }
        })
        print(f"  Created global config")
    
    # Create release version file with proper config
    release_path = f"//home/spark/conf/releases/{spyt_version}"
    if not client.exists(release_path):
        print(f"  Creating release version: {release_path}")
        client.create("document", release_path, attributes={
            "value": {
                "spark_yt_version": spyt_version,
                "spark_version": "2.4.0",
                "spark_dist": "spark-2.4.0-bin-hadoop2.7",
                "spark_yt_jar": "spark-yt-2.4.0.jar"
            }
        })
        print(f"  Created release version")
    else:
        # Update existing release config
        print(f"  Updating release version: {release_path}")
        client.set(f"{release_path}/@value", {
            "spark_yt_version": spyt_version,
            "spark_version": "2.4.0",
            "spark_dist": "spark-2.4.0-bin-hadoop2.7",
            "spark_yt_jar": f"spark-yt-{spyt_version}.jar"
        })
        print(f"  Updated release version")

def launch_cluster(proxy=None, pool=None, discovery_path=None,
                   worker_cores=None, worker_num=None, worker_memory=None,
                   spyt_version=None):
    proxy = proxy or os.getenv('YT_PROXY', CLUSTER_CONFIG['proxy'])
    pool = pool or os.getenv('YT_POOL', CLUSTER_CONFIG['pool'])
    discovery_path = discovery_path or PATHS['discovery']
    worker_cores = worker_cores or CLUSTER_CONFIG['worker_cores']
    worker_num = worker_num or CLUSTER_CONFIG['worker_num']
    worker_memory = worker_memory or CLUSTER_CONFIG['worker_memory']
    spyt_version = spyt_version or os.getenv('SPYT_VERSION', '2.4.0')
    
    # Ensure directories exist before launching
    ensure_spyt_directories(proxy, spyt_version)
    
    print(f"\nLaunching Spark cluster:")
    print(f"  Proxy: {proxy}")
    print(f"  Pool: {pool}")
    print(f"  Discovery path: {discovery_path}")
    print(f"  SPYT version: {spyt_version}")
    print(f"  Workers: {worker_num} x {worker_cores} cores, {worker_memory}")
    
    cmd = [
        "spark-launch-yt",
        "--proxy", proxy,
        "--pool", pool,
        "--discovery-path", discovery_path,
        "--spyt-version", spyt_version,
        "--worker-cores", str(worker_cores),
        "--worker-num", str(worker_num),
        "--worker-memory", worker_memory,
    ]
    
    try:
        subprocess.run(cmd, check=True)
        print("Cluster launched successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Failed to launch cluster: {e}")
        return False

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Launch Spark cluster')
    parser.add_argument('--proxy', help='YT cluster proxy')
    parser.add_argument('--pool', help='Compute pool')
    parser.add_argument('--discovery-path', help='Discovery path')
    parser.add_argument('--worker-cores', type=int, help='Cores per worker')
    parser.add_argument('--worker-num', type=int, help='Number of workers')
    parser.add_argument('--worker-memory', help='Memory per worker')
    parser.add_argument('--spyt-version', default='2.4.0', help='SPYT version (default: 2.4.0)')
    args = parser.parse_args()
    
    launch_cluster(
        proxy=args.proxy,
        pool=args.pool,
        discovery_path=args.discovery_path,
        worker_cores=args.worker_cores,
        worker_num=args.worker_num,
        worker_memory=args.worker_memory,
        spyt_version=args.spyt_version
    )