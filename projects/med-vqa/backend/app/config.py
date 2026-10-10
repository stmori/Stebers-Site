import json
import os


def _env(name, default=None):
    v = os.environ.get(name)
    return v if v not in (None, "") else default


OPENAI_API_KEY = _env("OPENAI_API_KEY")
OPENAI_BASE_URL = _env("OPENAI_BASE_URL")          # unset = api.openai.com; set to use any OpenAI-compatible server
MODEL = _env("MODEL", "gpt-4o-mini")
LLM_EXTRA_BODY = json.loads(_env("LLM_EXTRA_BODY", "{}"))  # e.g. {"chat_template_kwargs": {"enable_thinking": false}} for vLLM/Qwen
LLM_TIMEOUT_S = float(_env("LLM_TIMEOUT_S", "60"))
MOCK_LLM = _env("MOCK_LLM", "0") == "1"             # canned model output, real retrieval: build the UI without a key

INDEX_DIR = _env("INDEX_DIR", "/index")
FASTEMBED_CACHE = _env("FASTEMBED_CACHE", "/models")
TOP_K = int(_env("TOP_K", "5"))

MAX_IMAGE_MB = float(_env("MAX_IMAGE_MB", "8"))
MAX_SIDE_PX = int(_env("MAX_SIDE_PX", "1024"))
MAX_QUESTION_CHARS = int(_env("MAX_QUESTION_CHARS", "500"))

RATE_PER_MIN = int(_env("RATE_PER_MIN", "6"))
RATE_PER_DAY = int(_env("RATE_PER_DAY", "60"))

CORS_ORIGINS = [o.strip() for o in _env("CORS_ORIGINS", "").split(",") if o.strip()]

DISCLAIMER = ("Educational demo only. This is not medical advice and not a diagnosis. "
              "Talk to a qualified clinician about any medical image or symptom.")
