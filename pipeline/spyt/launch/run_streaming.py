import os
import sys
import argparse
import subprocess
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from pipeline.spyt.config.spark_config import CLUSTER_CONFIG, PATHS

LOCAL_JOB_PATH = Path(__file__).parent.parent / "jobs" / "streaming_job.py"

DEFAULT_PY_FILES = "yt:///home/hackathon/lib/spyt_deps.zip"
DEFAULT_PYSPARK_PYTHON = "/usr/bin/python3.11"


def upload_job_file(proxy, token, job_path, local_path=LOCAL_JOB_PATH):
    """Кладёт локальный файл джобы в Cypress, откуда его подхватит spark-submit."""
    from yt.wrapper import YtClient

    client = YtClient(proxy=proxy, token=token or None, config={"backend": "http"})
    parent = job_path.rsplit("/", 1)[0]
    if not client.exists(parent):
        client.create("map_node", parent, recursive=True)
    client.create("file", job_path, ignore_existing=True)
    with open(local_path, "rb") as f:
        client.write_file(job_path, f)


def run_streaming_job(proxy=None, token=None, job_path=None,
                      positions_raw=None, positions_raw_consumer=None, ref_aircraft=None,
                      positions_current=None, positions_history=None,
                      checkpoint_path=None, num_executors=1,
                      py_files=DEFAULT_PY_FILES,
                      pyspark_python=DEFAULT_PYSPARK_PYTHON, skip_upload=False):
    proxy = (proxy or os.getenv('YT_PROXY', CLUSTER_CONFIG['proxy'])).rstrip('/')
    token = token or os.getenv('YT_TOKEN', CLUSTER_CONFIG['token'])
    job_path = job_path or f"{PATHS['code']}/streaming_job.py"
    positions_raw = positions_raw or PATHS['positions_raw']
    positions_raw_consumer = positions_raw_consumer or PATHS['positions_raw_consumer']
    ref_aircraft = ref_aircraft or PATHS['ref_aircraft']
    positions_current = positions_current or PATHS['positions_current']
    positions_history = positions_history or PATHS['positions_history']
    checkpoint_path = checkpoint_path or PATHS['checkpoints']

    if not os.getenv('SPARK_CONF_DIR'):
        print("Внимание: SPARK_CONF_DIR не задан — похоже, не выполнен вход "
              "из setup/spyt-env.md (source spyt-env). spark-submit скорее всего "
              "упадёт с 'Master must either be yarn or start with spark, k8s, or local'.")

    if not skip_upload:
        print(f"Uploading job file to yt://{job_path}")
        upload_job_file(proxy, token, job_path)

    print("Running job_enrich:")
    print(f"  Master: ytsaurus://{proxy}")
    print(f"  Job path: yt://{job_path}")
    print(f"  positions_raw: {positions_raw}")
    print(f"  positions_raw_consumer: {positions_raw_consumer}")
    print(f"  ref_aircraft: {ref_aircraft}")
    print(f"  positions_current: {positions_current}")
    print(f"  positions_history: {positions_history}")
    print(f"  checkpoint: {checkpoint_path}")

    cmd = [
        "spark-submit",
        "--master", f"ytsaurus://{proxy}",
        "--deploy-mode", "cluster",
        "--num-executors", str(num_executors),
        "--conf", f"spark.pyspark.python={pyspark_python}",
        "--py-files", py_files,
        f"yt://{job_path}",
        "--positions-raw", positions_raw,
        "--positions-raw-consumer", positions_raw_consumer,
        "--ref-aircraft", ref_aircraft,
        "--positions-current", positions_current,
        "--positions-history", positions_history,
        "--checkpoint", checkpoint_path,
    ]

    try:
        subprocess.run(cmd, check=True)
        print("Streaming job submitted successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Failed to run streaming job: {e}")
        return False

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Run job_enrich streaming job (direct submit)')
    parser.add_argument('--proxy', help='YT cluster proxy (https://...)')
    parser.add_argument('--token', help='YT auth token')
    parser.add_argument('--job-path', help='Cypress path where the job script will be uploaded')
    parser.add_argument('--positions-raw', help='positions_raw table path')
    parser.add_argument('--positions-raw-consumer', help='registered queue_consumer path for positions_raw')
    parser.add_argument('--ref-aircraft', help='ref_aircraft table path')
    parser.add_argument('--positions-current', help='positions_current table path')
    parser.add_argument('--positions-history', help='positions_history table path')
    parser.add_argument('--checkpoint', help='Checkpoint path')
    parser.add_argument('--num-executors', type=int, default=1, help='Number of Spark executors')
    parser.add_argument('--py-files', default=DEFAULT_PY_FILES,
                       help='yt:// path to SPYT dependencies zip')
    parser.add_argument('--pyspark-python', default=DEFAULT_PYSPARK_PYTHON,
                       help='Python interpreter path on cluster worker nodes')
    parser.add_argument('--skip-upload', action='store_true',
                       help='Do not re-upload the job file before submitting')
    args = parser.parse_args()

    run_streaming_job(
        proxy=args.proxy,
        token=args.token,
        job_path=args.job_path,
        positions_raw=args.positions_raw,
        positions_raw_consumer=args.positions_raw_consumer,
        ref_aircraft=args.ref_aircraft,
        positions_current=args.positions_current,
        positions_history=args.positions_history,
        checkpoint_path=args.checkpoint,
        num_executors=args.num_executors,
        py_files=args.py_files,
        pyspark_python=args.pyspark_python,
        skip_upload=args.skip_upload,
    )
