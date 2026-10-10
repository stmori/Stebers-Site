"""OpenAI provider (also works with any OpenAI-compatible server, e.g. vLLM, via OPENAI_BASE_URL)."""
from openai import OpenAI

from .. import config
from ..errors import EngineError

_client = None


def client():
    global _client
    if _client is None:
        _client = OpenAI(api_key=config.OPENAI_API_KEY or "missing", base_url=config.OPENAI_BASE_URL,
                         timeout=config.LLM_TIMEOUT_S, max_retries=1)
    return _client


def _chat(messages, **kw):
    try:
        r = client().chat.completions.create(model=config.MODEL, messages=messages, max_tokens=config.MAX_OUTPUT_TOKENS,
                                             extra_body=config.LLM_EXTRA_BODY or None, **kw)
    except Exception as e:  # network, auth, rate limit, timeout
        raise EngineError(f"{type(e).__name__}: {e}") from e
    return (r.choices[0].message.content or "").strip()


def look(image_data_uri, question, system, user_text):
    return _chat([{"role": "system", "content": system},
                  {"role": "user", "content": [
                      {"type": "image_url", "image_url": {"url": image_data_uri}},
                      {"type": "text", "text": user_text}]}],
                 temperature=0, response_format={"type": "json_object"})


def answer(system, user_text):
    return _chat([{"role": "system", "content": system}, {"role": "user", "content": user_text}], temperature=0.2)
