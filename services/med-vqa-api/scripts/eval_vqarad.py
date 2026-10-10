"""Evaluate the live Med-VQA pipeline on VQA-RAD (test split, closed yes/no questions).

1. Vision stage: N random yes/no questions -> does findings.short_answer start with the right yes/no?
2. Full pipeline: M of those through /api/ask -> latency, citations per answer.

usage (from services/med-vqa-api, with the API key in the environment):
  python scripts/eval_vqarad.py --parquet <vqa-rad test parquet> --n 100 --m 20 --out eval/
Costs roughly $0.05-0.10 with Claude Haiku 5.5.
"""
import argparse, base64, io, json, os, random, re, statistics, sys, time
from concurrent.futures import ThreadPoolExecutor

import pandas as pd

sys.path.insert(0, os.getcwd())
os.environ.update(RATE_PER_MIN="1000", RATE_PER_DAY="100000", CACHE_SIZE="0")  # evaluation only: no rate limit, no cache
from fastapi.testclient import TestClient  # noqa: E402
from app import config, llm, main  # noqa: E402


def yes_no(text):
    m = re.search(r"\b(yes|no)\b", text.lower().split(".")[0])
    return m.group(1) if m else None


def main_():
    ap = argparse.ArgumentParser()
    ap.add_argument("--parquet", required=True); ap.add_argument("--n", type=int, default=100)
    ap.add_argument("--m", type=int, default=20); ap.add_argument("--out", default="eval")
    ap.add_argument("--seed", type=int, default=0); ap.add_argument("--workers", type=int, default=4)
    a = ap.parse_args()

    df = pd.read_parquet(a.parquet)
    df = df[df["answer"].str.lower().isin(["yes", "no"])].reset_index(drop=True)
    rows = df.sample(n=min(a.n, len(df)), random_state=a.seed).to_dict("records")

    def vision(r):
        uri, _ = main._prepare_image(r["image"]["bytes"])
        t = time.time()
        try:
            f = llm.look(uri, r["question"]); err = None
        except llm.EngineError as e:
            f, err = {"short_answer": ""}, str(e)[:120]
        pred = yes_no(f["short_answer"])
        return dict(question=r["question"], gt=r["answer"].lower(), pred=pred, correct=pred == r["answer"].lower(),
                    short_answer=f["short_answer"], seconds=round(time.time() - t, 2), error=err)

    with ThreadPoolExecutor(a.workers) as ex:
        v = list(ex.map(vision, rows))
    answered = [x for x in v if x["pred"]]
    acc = sum(x["correct"] for x in v) / len(v)
    acc_answered = sum(x["correct"] for x in answered) / max(len(answered), 1)

    c = TestClient(main.app)
    full = []
    for r in rows[: a.m]:
        t = time.time()
        res = c.post("/api/ask", files={"image": ("q.jpg", r["image"]["bytes"], "image/jpeg")}, data={"question": r["question"]})
        b = res.json()
        full.append(dict(status=res.status_code, seconds=round(time.time() - t, 2),
                         n_cited=sum(x["cited"] for x in b.get("citations", [])), n_sources=len(b.get("citations", [])),
                         timings=b.get("timings_ms")))
    ok = [x for x in full if x["status"] == 200]
    secs = sorted(x["seconds"] for x in ok)
    summary = dict(
        model=config.MODEL, dataset="VQA-RAD test, closed yes/no", seed=a.seed,
        vision_n=len(v), vision_accuracy=round(acc, 3), vision_answered_yes_no=len(answered),
        vision_accuracy_when_answered=round(acc_answered, 3), vision_errors=sum(bool(x["error"]) for x in v),
        pipeline_n=len(full), pipeline_ok=len(ok),
        pipeline_latency_s_median=statistics.median(secs) if secs else None,
        pipeline_latency_s_p90=secs[int(0.9 * (len(secs) - 1))] if secs else None,
        answers_with_citation=round(sum(x["n_cited"] > 0 for x in ok) / max(len(ok), 1), 3),
        mean_citations_per_answer=round(statistics.mean(x["n_cited"] for x in ok), 2) if ok else None)
    os.makedirs(a.out, exist_ok=True)
    json.dump(dict(summary=summary, vision=v, pipeline=full), open(os.path.join(a.out, "vqarad_results.json"), "w"), indent=1)
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main_()
