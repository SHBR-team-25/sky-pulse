import time

import pytest

from ingest_service.rate_limiter import DailyCreditBudget

_DAY = 86400.0
# Полночь UTC, чтобы в тестах не думать про остаток от деления на сутки.
_MIDNIGHT = 1_700_000_000.0 - (1_700_000_000.0 % _DAY)


def _freeze(monkeypatch: pytest.MonkeyPatch, now: float) -> None:
    # rate_limiter делает `import time`, поэтому патч самого модуля виден и ему.
    monkeypatch.setattr(time, "time", lambda: now)


def test_consumes_by_cost_not_by_request_count(monkeypatch: pytest.MonkeyPatch) -> None:
    _freeze(monkeypatch, _MIDNIGHT)
    budget = DailyCreditBudget(10)

    assert budget.try_consume(4)
    assert budget.try_consume(4)
    assert budget.remaining() == 2


def test_refuses_when_cost_does_not_fit_in_the_remainder(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _freeze(monkeypatch, _MIDNIGHT)
    budget = DailyCreditBudget(10)
    assert budget.try_consume(8)

    # Остатка (2) не хватает на полный запрос (4) — уходим в паузу, а не списываем в минус.
    assert not budget.try_consume(4)
    assert budget.remaining() == 2


def test_rolls_over_at_utc_midnight(monkeypatch: pytest.MonkeyPatch) -> None:
    _freeze(monkeypatch, _MIDNIGHT + 100)
    budget = DailyCreditBudget(4)
    assert budget.try_consume(4)
    assert not budget.try_consume(4)

    _freeze(monkeypatch, _MIDNIGHT + _DAY + 1)
    assert budget.try_consume(4)


def test_seconds_until_reset_counts_to_next_midnight(monkeypatch: pytest.MonkeyPatch) -> None:
    _freeze(monkeypatch, _MIDNIGHT + 3600)
    budget = DailyCreditBudget(4)

    assert budget.seconds_until_reset() == pytest.approx(_DAY - 3600)


def test_sync_remaining_trusts_opensky(monkeypatch: pytest.MonkeyPatch) -> None:
    _freeze(monkeypatch, _MIDNIGHT)
    budget = DailyCreditBudget(4000)
    budget.try_consume(4)

    budget.sync_remaining(3000)

    assert budget.remaining() == 3000


def test_refund_returns_credits_for_a_request_that_never_left(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _freeze(monkeypatch, _MIDNIGHT)
    budget = DailyCreditBudget(100)
    budget.try_consume(4)

    budget.refund(4)

    assert budget.remaining() == 100


def test_refund_never_goes_above_the_budget(monkeypatch: pytest.MonkeyPatch) -> None:
    _freeze(monkeypatch, _MIDNIGHT)
    budget = DailyCreditBudget(100)

    budget.refund(4)

    assert budget.remaining() == 100


def test_exhaust_stops_further_requests(monkeypatch: pytest.MonkeyPatch) -> None:
    _freeze(monkeypatch, _MIDNIGHT)
    budget = DailyCreditBudget(4000)

    budget.exhaust()

    assert budget.remaining() == 0
    assert not budget.try_consume(1)


def test_sync_remaining_never_lowers_usage(monkeypatch: pytest.MonkeyPatch) -> None:
    _freeze(monkeypatch, _MIDNIGHT)
    budget = DailyCreditBudget(4000)
    budget.sync_remaining(3000)

    # Более оптимистичная цифра не должна отматывать расход назад.
    budget.sync_remaining(3999)

    assert budget.remaining() == 3000
