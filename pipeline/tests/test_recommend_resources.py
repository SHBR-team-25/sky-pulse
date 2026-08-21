import importlib.util
from pathlib import Path

SCRIPT_PATH = Path(__file__).parents[1] / "scripts" / "recommend_resources.py"
SPEC = importlib.util.spec_from_file_location("recommend_resources", SCRIPT_PATH)
recommend_resources = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(recommend_resources)


def test_large_cluster_recommends_all_for_high_rate():
    capacity = recommend_resources.Capacity(24, 96, 12_000, 5)

    result = recommend_resources.recommend(capacity, {})

    assert result["OPENSKY_SCOPE"] == "all"
    assert result["STREAMING_NUM_EXECUTORS"] == "4"
    assert result["STREAMING_SHUFFLE_PARTITIONS"] == "32"
    assert result["SEGMENT_INTERVAL_SECONDS"] == "300"


def test_small_cluster_preserves_bbox():
    capacity = recommend_resources.Capacity(8, 24, 2_000, 10)
    env = {"OPENSKY_BBOX_LAMIN": "40", "OPENSKY_BBOX_LOMIN": "10"}

    result = recommend_resources.recommend(capacity, env)

    assert result["OPENSKY_SCOPE"] == "bbox"
    assert result["OPENSKY_BBOX_LAMIN"] == "40"
    assert result["OPENSKY_BBOX_LOMIN"] == "10"
    assert result["OPENSKY_BBOX_LAMAX"] == "55.0"
    assert result["STREAMING_NUM_EXECUTORS"] == "1"


def test_load_capacity_reports_empty_resources(monkeypatch):
    monkeypatch.delenv("CLUSTER_AVAILABLE_CORES", raising=False)
    monkeypatch.setenv("CLUSTER_AVAILABLE_MEMORY_GB", "64")

    try:
        recommend_resources.load_capacity()
    except ValueError as error:
        assert "CLUSTER_AVAILABLE_CORES is empty" in str(error)
    else:
        raise AssertionError("empty core capacity must be rejected")
