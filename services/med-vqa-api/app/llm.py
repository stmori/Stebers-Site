"""The two model calls: (1) look at the image -> structured findings, (2) write a cited answer.

The provider (Claude or OpenAI) is chosen by PROVIDER in .env; both return the same shapes.
"""
import json
import re

from . import config, prompts
from .errors import EngineError, RefusalError  # noqa: F401  (re-exported for main.py)

if config.PROVIDER == "anthropic":
    from .providers import claude as provider
elif config.PROVIDER == "openai":
    from .providers import openai_chat as provider
else:
    raise ValueError(f"PROVIDER must be 'anthropic' or 'openai', not {config.PROVIDER!r}")


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
                    short_answer="Mock answer. Set MOCK_LLM=0 and an API key for real output.",
                    search_terms=["pneumonia", "pleural effusion"])
    raw = provider.look(image_data_uri, question, prompts.VISION_SYSTEM, prompts.VISION_USER.format(question=question))
    f = _parse_json(raw) or {}
    obs = f.get("observations") or []
    if isinstance(obs, str):
        obs = [obs]
    terms = f.get("search_terms") or []
    if isinstance(terms, str):
        terms = [terms]
    terms = [str(t).strip()[:60] for t in terms if str(t).strip()][:4]
    return dict(is_medical_image=bool(f.get("is_medical_image", True)),
                modality=str(f.get("modality") or "Unknown"),
                body_region=str(f.get("body_region") or "Unknown"),
                observations=[str(o) for o in obs][:5],
                short_answer=str(f.get("short_answer") or raw[:300]),
                search_terms=terms)


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
    return provider.answer(prompts.ANSWER_SYSTEM, msg)
