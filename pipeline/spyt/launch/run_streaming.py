import os
import sys
import argparse
import subprocess
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))
from config.spark_config import CLUSTER_CONFIG, PATHS

def run_streaming_job(proxy=None, discovery_path=None, job_path=None,
                      input_path=None, output_path=None, checkpoint_path=None,
                      deploy_mode="cluster"):
    proxy = proxy or os.getenv('YT_PROXY', CLUSTER_CONFIG['proxy'])
    discovery_path = discovery_path or PATHS['discovery']
    job_path = job_path or f"yt://{PATHS['code']}/streaming_job.py"
    input_path = input_path or PATHS['input']
    output_path = output_path or PATHS['output']
    checkpoint_path = checkpoint_path or PATHS['checkpoints']
    
    print(f"Running streaming job:")
    print(f"  Proxy: {proxy}")
    print(f"  Discovery path: {discovery_path}")
    print(f"  Input: {input_path}")
    print(f"  Output: {output_path}")
    print(f"  Checkpoint: {checkpoint_path}")
    
    cmd = [
        "spark-submit-yt",
        "--proxy", proxy,
        "--discovery-path", discovery_path,
        "--deploy-mode", deploy_mode,
        "--conf", "spark.sql.streaming.schemaInference=true",
        "--conf", "spark.streaming.stopGracefullyOnShutdown=true",
        "--conf", "spark.sql.streaming.metricsEnabled=true",
        job_path,
        "--input", input_path,
        "--output", output_path,
        "--checkpoint", checkpoint_path,
    ]
    
    try:
        subprocess.run(cmd, check=True)
        print("Streaming job started successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Failed to run streaming job: {e}")
        return False

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Run streaming job')
    parser.add_argument('--proxy', help='YT cluster proxy')
    parser.add_argument('--discovery-path', help='Discovery path')
    parser.add_argument('--job-path', help='Path to job in YT')
    parser.add_argument('--input', help='Input path')
    parser.add_argument('--output', help='Output path')
    parser.add_argument('--checkpoint', help='Checkpoint path')
    parser.add_argument('--deploy-mode', default='cluster',
                       choices=['cluster', 'client'],
                       help='Deploy mode')
    args = parser.parse_args()
    
    run_streaming_job(
        proxy=args.proxy,
        discovery_path=args.discovery_path,
        job_path=args.job_path,
        input_path=args.input,
        output_path=args.output,
        checkpoint_path=args.checkpoint,
        deploy_mode=args.deploy_mode
    )