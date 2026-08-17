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


def submit(proxy, job_path, arguments, num_executors, py_files, pyspark_python):
    command = [
        "spark-submit", "--master", f"ytsaurus://{proxy}", "--deploy-mode", "cluster",
        "--num-executors", str(num_executors),
        "--conf", f"spark.pyspark.python={pyspark_python}",
        "--py-files", py_files, f"yt://{job_path}", *arguments,
    ]
    try:
        subprocess.run(command, check=True)
        print("Batch job completed successfully")
        return True
    except subprocess.CalledProcessError as error:
        print(f"Failed to run batch job: {error}")
        return False
