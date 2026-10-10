"""Offline tests for the model providers (no API key needed).

1. Claude provider with a fake Anthropic client: checks the exact request we send and how replies are handled.
2. Real Anthropic API with a deliberately invalid key: checks the SDK reaches the API and auth errors map to 502.
Run from projects/med-vqa/backend:  INDEX_DIR=... python ../scripts/test_providers.py
"""
import io
import json
import os
import sys
from types import SimpleNamespace as NS

os.environ.update(PROVIDER="anthropic", MODEL="claude-haiku-5-5", ANTHROPIC_API_KEY="sk-ant-invalid-test-key",
                  MOCK_LLM="0", RATE_PER_MIN="100")
sys.path.insert(0, os.getcwd())

from fastapi.testclient import TestClient  # noqa: E402
from PIL import Image  # noqa: E402

from app import main  # noqa: E402
from app.providers import claude  # noqa: E402

FINDINGS = {"is_medical_image": True, "modality": "Chest X-ray (PA)", "body_region": "Chest",
            "observations": ["Right upper lobe consolidation"], "short_answer": "Possibly pneumonia."}
ANSWER = "The image appears to show consolidation, which can be caused by pneumonia [1]. See a clinician."


class FakeMessages:
    def __init__(self, script):
        self.script, self.calls = list(script), []

    def create(self, **kw):
        self.calls.append(kw)
        stop, text = self.script.pop(0)
        content = [NS(type="thinking", thinking="", signature="sig")]  # Haiku 5.5 can lead with thinking blocks
        if text is not None:
            content.append(NS(type="text", text=text))
        return NS(stop_reason=stop, content=content)


def png_bytes():
    buf = io.BytesIO()
    Image.new("RGB", (1400, 1100), (90, 90, 90)).save(buf, format="PNG")
    return buf.getvalue()


def ask(c):
    return c.post("/api/ask", files={"image": ("x.png", png_bytes(), "image/png")},
                  data={"question": "What abnormality is visible?"})


ok = True


def check(name, cond, detail=""):
    global ok
    ok &= bool(cond)
    print(("PASS " if cond else "FAIL ") + name + (f"  ({detail})" if detail and not cond else ""))


c = TestClient(main.app)
h = c.get("/api/health").json()
check("health reports provider/model/key", h["provider"] == "anthropic" and h["model"] == "claude-haiku-5-5"
      and h["llm_configured"] is True, h)

# --- 1. happy path with fake client
fake = FakeMessages([("end_turn", json.dumps(FINDINGS)), ("end_turn", ANSWER)])
claude._client = NS(messages=fake)
r = ask(c)
body = r.json()
check("happy path 200", r.status_code == 200, body)
check("findings parsed from JSON", body.get("findings", {}).get("observations") == FINDINGS["observations"])
check("answer text read past thinking block", body.get("answer") == ANSWER)
check("citation [1] marked cited", body["citations"][0]["cited"] is True)
v, a = fake.calls
check("model + max_tokens sent", v["model"] == "claude-haiku-5-5" and v["max_tokens"] == 2048)
check("no sampling params (Haiku 5.5 rejects them)", not ({"temperature", "top_p", "top_k"} & set(v) | {"temperature", "top_p", "top_k"} & set(a)))
check("vision call: system prompt", v["system"].startswith("You are a medical imaging assistant"))
img = v["messages"][0]["content"][0]
check("vision call: base64 JPEG image block", img["type"] == "image" and img["source"]["type"] == "base64"
      and img["source"]["media_type"] == "image/jpeg" and len(img["source"]["data"]) > 1000)
check("vision call: structured output + effort", v["output_config"]["format"]["type"] == "json_schema"
      and v["output_config"]["effort"] == "low")
check("image downscaled to <=1024px", max(Image.open(io.BytesIO(__import__("base64").b64decode(img["source"]["data"]))).size) <= 1024)
check("answer call: text only, sources included", isinstance(a["messages"][0]["content"], str)
      and "[1]" in a["messages"][0]["content"] and "format" not in a["output_config"])

# --- refusal and truncation
claude._client = NS(messages=FakeMessages([("refusal", None)]))
r = ask(c)
check("refusal -> 422 with message", r.status_code == 422 and "declined" in r.json()["error"], r.text)
claude._client = NS(messages=FakeMessages([("end_turn", json.dumps(FINDINGS)), ("max_tokens", "The image appe")]))
r = ask(c)
check("truncated answer -> 502", r.status_code == 502, r.text)

# --- 2. real API, invalid key
claude._client = None
r = ask(c)
check("real API + invalid key -> 502 (SDK reached the API)", r.status_code == 502, r.text)

print("\nALL PASS" if ok else "\nSOME TESTS FAILED")
sys.exit(0 if ok else 1)
