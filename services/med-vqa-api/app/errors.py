class EngineError(Exception):
    """The model service failed (network, auth, rate limit, timeout, bad output)."""


class RefusalError(EngineError):
    """The model declined to answer this request."""
