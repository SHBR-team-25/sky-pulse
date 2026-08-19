import importlib.util
from pathlib import Path


LAUNCHER_PATH = Path(__file__).parents[2] / "spyt" / "launch" / "run_streaming.py"
MODULE_SPEC = importlib.util.spec_from_file_location("project_run_streaming", LAUNCHER_PATH)
run_streaming = importlib.util.module_from_spec(MODULE_SPEC)
MODULE_SPEC.loader.exec_module(run_streaming)


def test_direct_submit_uses_executor_block_manager_shuffle(monkeypatch):
    submitted = {}

    def fake_run(command, check):
        submitted["command"] = command
        submitted["check"] = check

    monkeypatch.setattr(run_streaming.subprocess, "run", fake_run)

    assert run_streaming.run_streaming_job(
        proxy="cluster",
        job_path="//code/streaming_job.py",
        positions_raw="//raw",
        positions_raw_consumer="//consumer",
        ref_aircraft="//ref",
        positions_current="//current",
        positions_history="//history",
        checkpoint_path="//checkpoint",
        skip_upload=True,
    )

    command = submitted["command"]
    assert submitted["check"] is True
    assert "spark.ytsaurus.shuffle.enabled=false" in command
    assert "spark.shuffle.service.enabled=false" in command
    assert "spark.shuffle.readHostLocalDisk=false" in command
