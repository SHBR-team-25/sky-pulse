import time

import requests

_SAFETY_MARGIN_SECONDS = 30


class TokenCache:
    def __init__(self, client_id: str, client_secret: str, token_url: str) -> None:
        self._client_id = client_id
        self._client_secret = client_secret
        self._token_url = token_url
        self._token: str | None = None
        self._expires_at: float = 0.0

    def get_token(self) -> str:
        if self._token is None or time.monotonic() >= self._expires_at:
            self._refresh()
        assert self._token is not None
        return self._token

    def _refresh(self) -> None:
        response = requests.post(
            self._token_url,
            data={
                "grant_type": "client_credentials",
                "client_id": self._client_id,
                "client_secret": self._client_secret,
            },
            timeout=30,
        )
        response.raise_for_status()
        payload = response.json()

        self._token = payload["access_token"]
        expires_in = payload["expires_in"]
        self._expires_at = time.monotonic() + expires_in - _SAFETY_MARGIN_SECONDS
