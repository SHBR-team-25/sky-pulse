import importlib.util
from pathlib import Path

MODULE_PATH = Path(__file__).parents[2] / "spyt" / "launch" / "batch_common.py"
MODULE_SPEC = importlib.util.spec_from_file_location("project_batch_common", MODULE_PATH)
batch_common = importlib.util.module_from_spec(MODULE_SPEC)
MODULE_SPEC.loader.exec_module(batch_common)


def test_batch_submit_uses_executor_block_manager_shuffle(monkeypatch):
    submitted = {}

    def fake_run(command, check):
        submitted["command"] = command
        submitted["check"] = check

    monkeypatch.setattr(batch_common.subprocess, "run", fake_run)

    assert batch_common.submit(
        "https://proxy.example",
        "//code/job.py",
        ["--input", "//input"],
        2,
        "yt:///lib/deps.zip",
        "/usr/bin/python3.11",
        driver_max_failures=1,
        try_avoid_duplicating_jobs=True,
    )

    command = submitted["command"]
    assert submitted["check"] is True
    assert "spark.ytsaurus.shuffle.enabled=false" in command
    assert "spark.shuffle.service.enabled=false" in command
    assert "spark.shuffle.readHostLocalDisk=false" in command
    assert "spark.ytsaurus.driver.maxFailures=1" in command
    assert "spark.ytsaurus.driver.operation.parameters={try_avoid_duplicating_jobs=true;}" in command
