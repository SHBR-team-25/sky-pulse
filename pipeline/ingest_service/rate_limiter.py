import time
from dataclasses import dataclass, field

_DAY_SECONDS = 86400


@dataclass
class DailyRequestBudget:
    daily_request_budget: int
    _day_start: float = field(default_factory=time.time)
    _count: int = 0

    def try_consume(self) -> bool:
        self._roll_over_if_new_day()
        if self._count >= self.daily_request_budget:
            return False
        self._count += 1
        return True

    def seconds_until_reset(self) -> float:
        return max(0.0, self._day_start + _DAY_SECONDS - time.time())

    def _roll_over_if_new_day(self) -> None:
        if time.time() - self._day_start >= _DAY_SECONDS:
            self._day_start = time.time()
            self._count = 0
