import time
from dataclasses import dataclass, field

_DAY_SECONDS = 86400


def _utc_day_start(now: float) -> float:
    # Привязка к календарю, а не к старту процесса: иначе каждый рестарт
    # выдавал бы свежий бюджет.
    return now - (now % _DAY_SECONDS)


@dataclass
class DailyCreditBudget:
    """Стоп-кран по суточному лимиту кредитов OpenSky (FR7, NFR4).

    Считает кредиты, а не запросы: цена запроса зависит от площади bbox,
    поэтому счётчик запросов от 429 не защищает.
    """

    daily_credit_budget: int
    _day_start: float = field(default_factory=lambda: _utc_day_start(time.time()))
    _used: int = 0

    def try_consume(self, cost: int) -> bool:
        self._roll_over_if_new_day()
        if self._used + cost > self.daily_credit_budget:
            return False
        self._used += cost
        return True

    def sync_remaining(self, remaining: int) -> None:
        """Подтянуть остаток от OpenSky: он точнее локальной оценки.

        Берём максимум из двух оценок расхода, чтобы рассинхрон никогда
        не играл в сторону перерасхода.
        """
        self._roll_over_if_new_day()
        self._used = max(self._used, self.daily_credit_budget - remaining)

    def refund(self, cost: int) -> None:
        """Вернуть кредиты за запрос, который не дошёл до OpenSky.

        Резервируем до запроса, иначе при ошибке не узнать, списал их сервер
        или нет. Без возврата час недоступности сети съел бы бюджет вхолостую.
        """
        self._roll_over_if_new_day()
        self._used = max(0, self._used - cost)

    def exhaust(self) -> None:
        """Считать бюджет исчерпанным: сервер отказал, значит оценка занижена."""
        self._roll_over_if_new_day()
        self._used = self.daily_credit_budget

    def remaining(self) -> int:
        self._roll_over_if_new_day()
        return max(0, self.daily_credit_budget - self._used)

    def seconds_until_reset(self) -> float:
        return max(0.0, self._day_start + _DAY_SECONDS - time.time())

    def _roll_over_if_new_day(self) -> None:
        day_start = _utc_day_start(time.time())
        if day_start != self._day_start:
            self._day_start = day_start
            self._used = 0
