"""The two model calls: (1) look at the image -> structured findings, (2) write a cited answer."""
import json
import re

from openai import OpenAI

from . import config, prompts


class EngineError(Exception):
    pass


_client = None


def client():
    global _client
    if _client is None:
        _client = OpenAI(api_key=config.OPENAI_API_KEY or "missing", base_url=config.OPENAI_BASE_URL,
                         timeout=config.LLM_TIMEOUT_S, max_retries=1)
    return _client


def _chat(messages, **kw):
    try:
        r = client().chat.completions.create(model=config.MODEL, messages=messages,
                                             extra_body=config.LLM_EXTRA_BODY or None, **kw)
    except Exception as e:  # network, auth, rate limit, timeout
        raise EngineError(f"{type(e).__name__}: {e}") from e
    return (r.choices[0].message.content or "").strip()


def _parse_json(text):
    text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text.strip())
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        m = re.search(r"\{.*\}", text, re.S)
        if m:
            try:
                return json.loads(m.group(0))
            except json.JSONDecodeError:
                pass
    return None


def look(image_data_uri, question):
    if config.MOCK_LLM:
        return dict(is_medical_image=True, modality="Chest X-ray (PA) [mock]", body_region="Chest",
                    observations=["Mock mode: no model was called", "Possible right upper lobe opacity"],
                    short_answer="Mock answer. Set OPENAI_API_KEY and MOCK_LLM=0 for real output.")
    raw = _chat([{"role": "system", "content": prompts.VISION_SYSTEM},
                 {"role": "user", "content": [
                     {"type": "image_url", "image_url": {"url": image_data_uri}},
                     {"type": "text", "text": prompts.VISION_USER.format(question=question)}]}],
                temperature=0, max_tokens=400, response_format={"type": "json_object"})
    f = _parse_json(raw) or {}
    obs = f.get("observations") or []
    if isinstance(obs, str):
        obs = [obs]
    return dict(is_medical_image=bool(f.get("is_medical_image", True)),
                modality=str(f.get("modality") or "Unknown"),
                body_region=str(f.get("body_region") or "Unknown"),
                observations=[str(o) for o in obs][:5],
                short_answer=str(f.get("short_answer") or raw[:300]))


def answer(question, findings, hits):
    if config.MOCK_LLM:
        return ("Mock answer: the image appears to show an opacity in the right upper lung [1]. "
                "Conditions like this are described in the reference passages [2]. "
                "A qualified clinician should interpret any medical image.")
    msg = prompts.ANSWER_USER.format(question=question, modality=findings["modality"],
                                     body_region=findings["body_region"],
                                     observations="; ".join(findings["observations"]) or "none reported",
                                     short_answer=findings["short_answer"],
                                     sources=prompts.format_sources(hits))
    return _chat([{"role": "system", "content": prompts.ANSWER_SYSTEM},
                  {"role": "user", "content": msg}], temperature=0.2, max_tokens=500)
