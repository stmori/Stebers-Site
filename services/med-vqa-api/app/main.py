"""Med-VQA API: POST /api/ask (image + question -> findings, cited answer), GET /api/health."""
import base64
import copy
import hashlib
import io
import json
import logging
import re
import time
from collections import OrderedDict, defaultdict, deque

from fastapi import FastAPI, File, Form, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image, UnidentifiedImageError

from . import config, dicom, llm
from .rag import Retriever
from .tools.nuclei import NucleiTool, summary_for_prompt

log = logging.getLogger("medvqa")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

app = FastAPI(title="Med-VQA API", docs_url="/api/docs", openapi_url="/api/openapi.json")
if config.CORS_ORIGINS:
    app.add_middleware(CORSMiddleware, allow_origins=config.CORS_ORIGINS, allow_methods=["GET", "POST"],
                       allow_headers=["*"])

retriever = Retriever()
nuclei_tool = NucleiTool()
log.info("index loaded: %d passages, provider=%s, model=%s, mock=%s, key set=%s",
         retriever.count(), config.PROVIDER, config.MODEL, config.MOCK_LLM, config.llm_configured())
log.info("nuclei tool: %s", "ready" if nuclei_tool.ready else f"not installed ({config.NUCLEI_MODEL})")

# ---- per-IP rate limit (in memory; run a single uvicorn worker) ----
_hits = defaultdict(deque)


def _client_ip(request: Request):
    fwd = request.headers.get("x-forwarded-for")
    return fwd.split(",")[0].strip() if fwd else (request.client.host if request.client else "unknown")


def _rate_limited(ip):
    now = time.time()
    q = _hits[ip]
    while q and now - q[0] > 86400:
        q.popleft()
    if len(q) >= config.RATE_PER_DAY or sum(1 for t in q if now - t < 60) >= config.RATE_PER_MIN:
        return True
    q.append(now)
    return False


# ---- answer cache: identical image + question returns the stored answer instantly, at no API cost ----
_cache = OrderedDict()


def _cache_key(data: bytes, question: str, history=None):
    q = re.sub(r"\s+", " ", question.lower()).strip()
    h = json.dumps(history or [], sort_keys=True)
    return hashlib.sha256(data + b"\0" + q.encode() + b"\0" + h.encode() + b"\0" + config.MODEL.encode()).hexdigest()


def _parse_history(raw: str):
    """Optional earlier turns about the same image: JSON [{"question": ..., "answer": ...}, ...]. Bad input is ignored."""
    try:
        items = json.loads(raw) if raw else []
    except ValueError:
        return []
    if not isinstance(items, list):
        return []
    turns = [dict(question=str(t.get("question", ""))[:300], answer=str(t.get("answer", ""))[:800])
             for t in items if isinstance(t, dict) and t.get("question") and t.get("answer")]
    return turns[-3:]


def _cache_get(key):
    hit = _cache.get(key)
    if not hit or time.time() - hit[0] > config.CACHE_TTL_S:
        _cache.pop(key, None)
        return None
    _cache.move_to_end(key)
    return dict(copy.deepcopy(hit[1]), cached=True)


def _cache_put(key, response):
    if config.CACHE_SIZE <= 0:
        return
    _cache[key] = (time.time(), copy.deepcopy(response))
    _cache.move_to_end(key)
    while len(_cache) > config.CACHE_SIZE:
        _cache.popitem(last=False)


def _ensure_tool_mention(text, nuclei):
    """The answer must say whether the requested nuclei tool ran. If the model left it out, append the tool's own sentence."""
    if not nuclei:
        return text
    t = text.lower()
    if nuclei["status"] == "ok":
        if str(nuclei.get("count")) in text and "nucle" in t:
            return text
        return f'{text}\n\nA nuclei segmentation model {nuclei["message"][0].lower()}{nuclei["message"][1:]}'
    if "nucle" in t and any(w in t for w in ("analysis", "segmentation", "tool")):
        return text
    return f'{text}\n\n{nuclei["message"]}'


def _split_merged_citations(text, n_sources):
    """Fix citations the model glued together, e.g. "[12]" with 5 sources becomes "[1][2]"."""
    def fix(m):
        num = m.group(1)
        if int(num) <= n_sources or not all("1" <= d <= str(n_sources) for d in num):
            return m.group(0)
        return "".join(f"[{d}]" for d in num)
    return re.sub(r"\[(\d{2,})\]", fix, text) if 0 < n_sources < 10 else text


def _is_chest_xray(findings):
    text = f'{findings["modality"]} {findings["body_region"]}'.lower()
    return "chest" in text and any(w in text for w in ("x-ray", "xray", "radiograph", "cxr"))


def _error(status, message):
    return JSONResponse(status_code=status, content={"error": message})


def _prepare_image(data: bytes):
    """Validate, convert DICOM, downscale and re-encode as JPEG (drops EXIF/DICOM headers). Never written to disk."""
    if len(data) > config.MAX_IMAGE_MB * 1024 * 1024:
        raise ValueError(f"Image is larger than {config.MAX_IMAGE_MB:g} MB.")
    if dicom.is_dicom(data):
        img = dicom.to_image(data)
    else:
        try:
            img = Image.open(io.BytesIO(data))
            img.load()
        except (UnidentifiedImageError, OSError):
            raise ValueError("That file isn't a readable image. Upload a PNG, JPEG, WebP or DICOM (.dcm) file.")
        if img.format not in ("PNG", "JPEG", "WEBP"):
            raise ValueError("Upload a PNG, JPEG, WebP or DICOM (.dcm) file.")
        img = img.convert("RGB")
    img.thumbnail((config.MAX_SIDE_PX, config.MAX_SIDE_PX))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode(), img


@app.get("/api/health")
def health():
    return {"status": "ok", "provider": config.PROVIDER, "model": config.MODEL, "mock": config.MOCK_LLM,
            "llm_configured": config.llm_configured(), "index_passages": retriever.count(), "index_cases": retriever.cases_count(),
            "nuclei_tool": nuclei_tool.ready, "cached_answers": len(_cache)}


@app.post("/api/ask")
def ask(request: Request, image: UploadFile = File(...), question: str = Form(...), history: str = Form(""),
        analyze_nuclei: bool = Form(False)):
    question = (question or "").strip()
    if not 3 <= len(question) <= config.MAX_QUESTION_CHARS:
        return _error(400, f"Ask a question between 3 and {config.MAX_QUESTION_CHARS} characters.")
    data = image.file.read()
    turns = _parse_history(history)
    key = _cache_key(data, question + ("\0nuclei" if analyze_nuclei else ""), turns)
    cached = _cache_get(key)
    if cached:                                     # repeat question: instant, free, not rate-limited
        log.info("ask cache hit")
        return cached
    if _rate_limited(_client_ip(request)):
        return _error(429, "Too many requests. Try again in a minute.")
    try:
        uri, img = _prepare_image(data)
    except ValueError as e:
        return _error(400, str(e))

    t0 = time.time()
    try:
        findings = llm.look(uri, question, turns)
    except llm.RefusalError:
        return _error(422, "The AI model declined to answer this request. Try a different image or question.")
    except llm.EngineError as e:
        log.warning("vision call failed: %s", e)
        return _error(502, "The AI model is unavailable right now. Try again in a minute.")
    t1 = time.time()

    nuclei = nuclei_tool.run(img, findings) if analyze_nuclei else None   # optional specialist tool (H&E only)
    analysis = {"nuclei": nuclei} if nuclei else {}
    t1b = time.time()

    if not findings["is_medical_image"]:
        response = {"findings": findings, "citations": [], "similar_cases": [], "disclaimer": config.DISCLAIMER, "model": config.MODEL,
                    "answer": "This doesn't look like a medical image, so there is nothing to look up. "
                              "Try an X-ray, CT, MRI or histology image.",
                    "analysis": analysis,
                    "timings_ms": {"vision": int((t1 - t0) * 1000), "nuclei": int((t1b - t1) * 1000), "retrieval": 0, "answer": 0},
                    "cached": False}
        _cache_put(key, response)
        return response

    context = " ".join([question, findings["modality"], *findings["observations"]])
    hits = retriever.search_many([*findings["search_terms"], context])
    similar = retriever.similar_cases(
        f'Findings: {"; ".join(findings["observations"])} Impression: {findings["short_answer"]}'
    ) if _is_chest_xray(findings) else []
    t2 = time.time()

    try:
        text = llm.answer(question, findings, hits, turns, summary_for_prompt(nuclei))
    except llm.RefusalError:
        return _error(422, "The AI model declined to answer this request. Try a different image or question.")
    except llm.EngineError as e:
        log.warning("answer call failed: %s", e)
        return _error(502, "The AI model is unavailable right now. Try again in a minute.")
    t3 = time.time()

    text = _ensure_tool_mention(_split_merged_citations(text, len(hits)), nuclei)
    cited = {int(n) for n in re.findall(r"\[(\d+)\]", text)}
    citations = [dict(n=i, title=h["title"], url=h["url"], source=h["source"], snippet=h["text"][:400],
                      score=h["score"], cited=i in cited) for i, h in enumerate(hits, 1)]
    timings = {"vision": int((t1 - t0) * 1000), "nuclei": int((t1b - t1) * 1000), "retrieval": int((t2 - t1b) * 1000),
               "answer": int((t3 - t2) * 1000)}
    log.info("ask ok %s", timings)  # never log the image or question text
    response = {"findings": findings, "answer": text, "citations": citations, "similar_cases": similar,
                "analysis": analysis, "disclaimer": config.DISCLAIMER, "model": config.MODEL, "timings_ms": timings,
                "cached": False}
    _cache_put(key, response)
    return response
