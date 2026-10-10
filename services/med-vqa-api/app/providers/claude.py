"""Claude (Anthropic API) provider. Default model: claude-haiku-5-5.

Notes for Claude Haiku 5.5:
- Custom sampling parameters (temperature/top_p/top_k) are rejected, so none are sent.
- Thinking is on by default and counts toward max_tokens; effort controls how much it thinks.
- Responses can start with thinking blocks, so text is read by block type, never by position.
"""
import anthropic

from .. import config
from ..errors import EngineError, RefusalError

FINDINGS_SCHEMA = {
    "type": "object",
    "properties": {
        "is_medical_image": {"type": "boolean"},
        "modality": {"type": "string"},
        "body_region": {"type": "string"},
        "observations": {"type": "array", "items": {"type": "string"}},
        "short_answer": {"type": "string"},
        "search_terms": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["is_medical_image", "modality", "body_region", "observations", "short_answer", "search_terms"],
    "additionalProperties": False,
}

_client = None


def client():
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY, timeout=config.LLM_TIMEOUT_S, max_retries=1)
    return _client


def _create(**kwargs):
    try:
        response = client().messages.create(model=config.MODEL, max_tokens=config.MAX_OUTPUT_TOKENS, **kwargs)
    except anthropic.AuthenticationError as e:
        raise EngineError(f"authentication failed, check ANTHROPIC_API_KEY: {e}") from e
    except anthropic.RateLimitError as e:
        raise EngineError(f"rate limited by the API: {e}") from e
    except anthropic.APIStatusError as e:
        raise EngineError(f"API error {e.status_code}: {e}") from e
    except anthropic.APIConnectionError as e:
        raise EngineError(f"could not reach the API: {e}") from e
    if response.stop_reason == "refusal":
        raise RefusalError("the model declined this request")
    if response.stop_reason == "max_tokens":
        raise EngineError("the model ran out of output tokens; raise MAX_OUTPUT_TOKENS")
    return "".join(b.text for b in response.content if b.type == "text").strip()


def look(image_data_uri, question, system, user_text):
    """Image + question -> JSON text guaranteed to match FINDINGS_SCHEMA."""
    header, b64 = image_data_uri.split(",", 1)
    media_type = header.removeprefix("data:").removesuffix(";base64")
    return _create(
        system=system,
        output_config={"effort": config.EFFORT, "format": {"type": "json_schema", "schema": FINDINGS_SCHEMA}},
        messages=[{"role": "user", "content": [
            {"type": "image", "source": {"type": "base64", "media_type": media_type, "data": b64}},
            {"type": "text", "text": user_text},
        ]}],
    )


def answer(system, user_text):
    """Findings + numbered sources -> cited answer text."""
    return _create(system=system, output_config={"effort": config.EFFORT},
                   messages=[{"role": "user", "content": user_text}])
