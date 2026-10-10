"""Add the Open-I (Indiana University) chest X-ray reports to an existing index as the "cases" collection.

Report text only (impression, findings, MeSH problems); no images. Embedded with the same model as the passages
(BAAI/bge-small-en-v1.5), so the API can search both with one embedder.

usage: python build_cases_index.py --parquet-dir <ykumards__open-i/data> --index <index dir> [--exclude 818,1031] [--backend st]
"""
import argparse, glob, json, os, re, time

import chromadb
import pandas as pd
from fastembed import TextEmbedding

COLLECTION = "cases"


def clean(s):
    return re.sub(r"\s+", " ", str(s or "")).replace("XXXX", "___").strip()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--parquet-dir", required=True); ap.add_argument("--index", required=True)
    ap.add_argument("--exclude", default=""); ap.add_argument("--backend", default="fastembed", choices=["fastembed", "st"])
    a = ap.parse_args()
    info_path = os.path.join(a.index, "index_info.json")
    info = json.load(open(info_path, encoding="utf-8"))
    cols = ["uid", "MeSH", "Problems", "indication", "findings", "impression"]
    df = pd.concat([pd.read_parquet(f, columns=cols) for f in sorted(glob.glob(os.path.join(a.parquet_dir, "*.parquet")))])
    exclude = {int(x) for x in a.exclude.split(",") if x.strip()}
    df = df[~df["uid"].isin(exclude)]
    for c in ["MeSH", "Problems", "indication", "findings", "impression"]:
        df[c] = df[c].map(clean)
    df = df[(df["impression"].str.len() > 10) | (df["findings"].str.len() > 10)].drop_duplicates("uid").reset_index(drop=True)
    docs = [f"Impression: {i}\nFindings: {f}\nProblems: {p}" for i, f, p in zip(df["impression"], df["findings"], df["Problems"])]
    metas = [dict(uid=int(u), problems=p[:300], impression=i[:500], findings=f[:800], indication=ind[:200])
             for u, p, i, f, ind in zip(df["uid"], df["Problems"], df["impression"], df["findings"], df["indication"])]
    print(f"{len(docs)} reports (excluded {len(exclude)} uids)", flush=True)

    t = time.time()
    if a.backend == "st":
        from sentence_transformers import SentenceTransformer
        st = SentenceTransformer(info["embed_model"], device="cuda")
        vecs = st.encode(docs, batch_size=256, normalize_embeddings=True, convert_to_numpy=True).tolist()
    else:
        vecs = [v.tolist() for v in TextEmbedding(info["embed_model"], threads=4).embed(docs, batch_size=64)]
    print(f"embedded in {time.time() - t:.0f}s", flush=True)

    client = chromadb.PersistentClient(path=a.index)
    try:
        client.delete_collection(COLLECTION)
    except Exception:
        pass
    col = client.create_collection(COLLECTION, metadata={"hnsw:space": "cosine", "embed_model": info["embed_model"]})
    step = min(5000, client.get_max_batch_size())
    for s in range(0, len(docs), step):
        col.add(ids=[f"case{m['uid']}" for m in metas[s:s + step]], documents=docs[s:s + step],
                metadatas=metas[s:s + step], embeddings=vecs[s:s + step])
    info["cases_collection"] = COLLECTION
    info["cases_count"] = col.count()
    info["cases_source"] = "Open-I / Indiana University chest X-ray reports (NLM); text only"
    json.dump(info, open(info_path, "w", encoding="utf-8"), indent=2)
    print(f"collection '{COLLECTION}' count = {col.count()}", flush=True)


if __name__ == "__main__":
    main()
