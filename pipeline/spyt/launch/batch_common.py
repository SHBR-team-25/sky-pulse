import subprocess

DEFAULT_PY_FILES = "yt:///home/hackathon/lib/spyt_deps.zip"
DEFAULT_PYSPARK_PYTHON = "/usr/bin/python3.11"


def upload_job_file(proxy, token, job_path, local_path):
    from yt.wrapper import YtClient

    client = YtClient(proxy=proxy, token=token or None, config={"backend": "http"})
    parent = job_path.rsplit("/", 1)[0]
    if not client.exists(parent):
        client.create("map_node", parent, recursive=True)
    client.create("file", job_path, ignore_existing=True)
    with open(local_path, "rb") as file:
        client.write_file(job_path, file)


def submit(
    proxy,
    job_path,
    arguments,
    num_executors,
    py_files,
    pyspark_python,
    *,
    driver_memory=None,
    driver_memory_overhead=None,
    executor_memory=None,
    executor_cores=None,
    shuffle_partitions=None,
):
    command = [
        "spark-submit",
        "--master",
        f"ytsaurus://{proxy}",
        "--deploy-mode",
        "cluster",
        "--num-executors",
        str(num_executors),
    ]
    if driver_memory:
        command.extend(["--driver-memory", driver_memory])
    if executor_memory:
        command.extend(["--executor-memory", executor_memory])
    if executor_cores is not None:
        command.extend(["--executor-cores", str(executor_cores)])
    if driver_memory_overhead:
        command.extend(["--conf", f"spark.driver.memoryOverhead={driver_memory_overhead}"])
    if shuffle_partitions is not None:
        command.extend(["--conf", f"spark.sql.shuffle.partitions={shuffle_partitions}"])
    command.extend(
        [
            # Executors placed on the same YTsaurus exec-node still have isolated
            # sandbox /tmp directories. Spark's host-local shortcut therefore tries
            # to open another executor's non-existent local shuffle index. Fetch
            # blocks over the owning executor's BlockManager instead.
            "--conf",
            "spark.ytsaurus.shuffle.enabled=false",
            "--conf",
            "spark.shuffle.service.enabled=false",
            "--conf",
            "spark.shuffle.readHostLocalDisk=false",
            "--conf",
            f"spark.pyspark.python={pyspark_python}",
            "--py-files",
            py_files,
            f"yt://{job_path}",
            *arguments,
        ]
    )
    try:
        subprocess.run(command, check=True)
        print("Batch job completed successfully")
        return True
    except subprocess.CalledProcessError as error:
        print(f"Failed to run batch job: {error}")
        return False
