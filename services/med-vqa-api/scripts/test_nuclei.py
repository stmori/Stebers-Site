"""Nuclei-tool checks (no API key needed; a fake Claude client stands in for the model).

usage (from services/med-vqa-api):  INDEX_DIR=... [NUCLEI_MODEL=...onnx] python scripts/test_nuclei.py [H&E tile.png]
Without the ONNX model the "unavailable" path is tested; with it, a real H&E tile is segmented end to end.
"""
import io, json, os, sys
from types import SimpleNamespace as NS

os.environ.update(PROVIDER="anthropic", ANTHROPIC_API_KEY="sk-ant-test", MOCK_LLM="0", RATE_PER_MIN="1000", CACHE_SIZE="0")
sys.path.insert(0, os.getcwd())
from fastapi.testclient import TestClient  # noqa: E402
from PIL import Image  # noqa: E402
from app import main  # noqa: E402
from app.providers import claude  # noqa: E402

ok = True
def check(name, cond, detail=""):
    global ok; ok &= bool(cond); print(("PASS " if cond else "FAIL ") + name + (f"  ({detail})" if detail and not cond else ""))

class Fake:
    def __init__(self, findings): self.findings, self.calls = findings, []
    def create(self, **kw):
        self.calls.append(kw)
        text = json.dumps(self.findings) if len(self.calls) == 1 else "Answer text [1]."
        return NS(stop_reason="end_turn", content=[NS(type="text", text=text)])

def findings(modality, region):
    return {"is_medical_image": True, "modality": modality, "body_region": region, "observations": ["obs"],
            "short_answer": "x", "search_terms": ["cancer"]}

def ask(img_bytes, fnd, on=True):
    fake = Fake(fnd); claude._client = NS(messages=fake)
    r = c.post("/api/ask", files={"image": ("t.png", img_bytes, "image/png")},
               data={"question": "How many nuclei are there?", "analyze_nuclei": "true" if on else "false"})
    return r, fake

c = TestClient(main.app)

# the answer must always say whether the requested tool ran, exactly once, in one standard line at the end
na = {"status": "not_applicable", "message": "The nuclei analysis tool only works on H&E-stained histology slides, so it wasn't run on this chest X-ray."}
okr = {"status": "ok", "count": 48, "message": "Found 48 nuclei covering 15.1% of the tile."}
fin = main._finish_answer
check("tool line: 'not applicable' note appended", fin("Pneumonia is likely.", na) == "Pneumonia is likely.\n\nNuclei analysis: " + na["message"])
check("tool line: model's own tool sentence replaced, not duplicated",
      fin("Likely pneumonia. The nuclei analysis tool doesn't apply to X-rays.", na).count("nuclei analysis tool") == 1)
r_ok = fin("Benign glands [1]. The nuclei segmentation model counted 48 nuclei. Size varies a lot, which fits atypia.", okr)
check("tool line: measurements appended once", r_ok.count("48 nuclei") == 1 and r_ok.endswith(okr["message"])
      and "Size varies a lot" in r_ok and "[1]" in r_ok, r_ok)
check("no tool requested: answer untouched", fin("Text [1].", None) == "Text [1].")
check("passage meta-comments dropped", fin("Likely pneumonia [1]. None of the reference passages cover this.", None) == "Likely pneumonia [1].")
check("'reference material' meta-comment dropped",
      fin("Adenocarcinoma is likely. This is discussed in the reference material on glandular cancers [5].", None) == "Adenocarcinoma is likely.")
check("ordinary medical wording kept", fin("Mucus blocks the nasal passages. Pneumonia fills air sacs.", None).count(".") == 2)
blank = io.BytesIO(); Image.new("RGB", (512, 512), (230, 190, 210)).save(blank, format="PNG"); blank = blank.getvalue()
TILE_PATH = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1] else ""
tile = open(TILE_PATH, "rb").read() if TILE_PATH else blank
he = findings("Histology (H&E)", "Tissue sample")

r, fake = ask(tile, he, on=False)
check("toggle off: no analysis, model called twice", r.status_code == 200 and r.json()["analysis"] == {} and len(fake.calls) == 2, r.text[:200])

r, fake = ask(tile, findings("Chest X-ray (PA)", "Chest"))
a = r.json().get("analysis", {}).get("nuclei", {})
check("chest X-ray: tool says not applicable, Haiku still answers",
      r.status_code == 200 and a.get("status") in ("not_applicable", "unavailable") and r.json()["answer"], a)
check("answer prompt is told the tool didn't apply", "Nuclei analysis" in fake.calls[1]["messages"][0]["content"])

r, fake = ask(tile, he)
a = r.json().get("analysis", {}).get("nuclei", {})
print("health nuclei_tool:", c.get("/api/health").json().get("nuclei_tool"))
if main.nuclei_tool.ready and TILE_PATH:
    check("H&E tile: nuclei segmented", a.get("status") == "ok" and a.get("count", 0) >= 10, {k: v for k, v in a.items() if k != "overlay"})
    check("overlay returned as a JPEG data URI", str(a.get("overlay", "")).startswith("data:image/jpeg;base64,"))
    check("answer prompt receives the measurements", "Found" in fake.calls[1]["messages"][0]["content"])
    print("   ", a.get("message"), "| timing ms:", r.json()["timings_ms"].get("nuclei"))
    r2, _ = ask(blank, he)
    check("plain pink image: 'no nuclei' handled", r2.json()["analysis"]["nuclei"]["status"] in ("no_nuclei", "ok"), r2.json()["analysis"])
else:
    check("model not installed: reported as unavailable, answer still returned",
          a.get("status") == "unavailable" and r.status_code == 200, a)
print("\nALL PASS" if ok else "\nSOME TESTS FAILED"); sys.exit(0 if ok else 1)
