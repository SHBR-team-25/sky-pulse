import pytest

from common.config import load_yt_config


RETENTION_ENV_NAMES = (
    "POSITIONS_HISTORY_RETENTION_SECONDS",
    "FLIGHTS_SEGMENTS_RETENTION_SECONDS",
    "AIRPORT_EVENTS_RETENTION_SECONDS",
    "DASHBOARD_TREND_RETENTION_SECONDS",
)


def required_environment(monkeypatch):
    monkeypatch.setenv("YT_PROXY", "proxy")
    monkeypatch.setenv("YT_TOKEN", "token")
    monkeypatch.setenv("YT_BASE_PATH", "//base")
    monkeypatch.delenv("DASHBOARD_WINDOW_SECONDS", raising=False)
    monkeypatch.delenv("QUEUE_RETAINED_LIFETIME_SECONDS", raising=False)
    for name in RETENTION_ENV_NAMES:
        monkeypatch.delenv(name, raising=False)


def test_table_retentions_have_independent_defaults(monkeypatch):
    required_environment(monkeypatch)

    config = load_yt_config()

    assert config.positions_history_retention_seconds == 10 * 60 * 60
    assert config.flights_segments_retention_seconds == 2 * 24 * 60 * 60
    assert config.airport_events_retention_seconds == 2 * 24 * 60 * 60
    assert config.dashboard_trend_retention_seconds == 2 * 24 * 60 * 60


def test_table_retentions_are_loaded_independently(monkeypatch):
    required_environment(monkeypatch)
    monkeypatch.setenv("POSITIONS_HISTORY_RETENTION_SECONDS", "36001")
    monkeypatch.setenv("FLIGHTS_SEGMENTS_RETENTION_SECONDS", "172801")
    monkeypatch.setenv("AIRPORT_EVENTS_RETENTION_SECONDS", "172802")
    monkeypatch.setenv("DASHBOARD_TREND_RETENTION_SECONDS", "172803")

    config = load_yt_config()

    assert config.positions_history_retention_seconds == 36001
    assert config.flights_segments_retention_seconds == 172801
    assert config.airport_events_retention_seconds == 172802
    assert config.dashboard_trend_retention_seconds == 172803


@pytest.mark.parametrize("name", RETENTION_ENV_NAMES)
def test_table_retention_must_be_positive(monkeypatch, name):
    required_environment(monkeypatch)
    monkeypatch.setenv(name, "0")

    with pytest.raises(ValueError, match=name):
        load_yt_config()


@pytest.mark.parametrize(
    "name",
    (
        "FLIGHTS_SEGMENTS_RETENTION_SECONDS",
        "AIRPORT_EVENTS_RETENTION_SECONDS",
        "DASHBOARD_TREND_RETENTION_SECONDS",
    ),
)
def test_dashboard_source_retention_must_exceed_window(monkeypatch, name):
    required_environment(monkeypatch)
    monkeypatch.setenv("DASHBOARD_WINDOW_SECONDS", "86400")
    monkeypatch.setenv(name, "86400")

    with pytest.raises(ValueError, match=name):
        load_yt_config()


def test_positions_history_retention_can_be_shorter_than_dashboard_window(monkeypatch):
    required_environment(monkeypatch)
    monkeypatch.setenv("POSITIONS_HISTORY_RETENTION_SECONDS", "36000")
    monkeypatch.setenv("DASHBOARD_WINDOW_SECONDS", "86400")

    assert load_yt_config().positions_history_retention_seconds == 36000
