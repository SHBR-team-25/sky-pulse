from pipeline.spyt.launch import batch_common


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
    )

    command = submitted["command"]
    assert submitted["check"] is True
    assert "spark.ytsaurus.shuffle.enabled=false" in command
    assert "spark.shuffle.service.enabled=false" in command
    assert "spark.shuffle.readHostLocalDisk=false" in command
