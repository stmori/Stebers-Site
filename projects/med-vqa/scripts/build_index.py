"""Build the Med-VQA knowledge base: MedQuAD (NIH Q&A with source URLs) -> persisted ChromaDB.

Embeddings: fastembed "BAAI/bge-small-en-v1.5" (ONNX, 384-d). The backend must embed queries with the SAME
fastembed model and prefix them with QUERY_PREFIX. Chroma version must match the backend (pinned 1.5.9).

usage: python build_index.py --parquet <MedQuAD parquet> --out <dir> [--limit N] [--threads N]
"""
import argparse, json, os, re, time

import chromadb
import pandas as pd
from fastembed import TextEmbedding

MODEL = "BAAI/bge-small-en-v1.5"
QUERY_PREFIX = "Represent this sentence for searching relevant passages: "
COLLECTION = "medquad"


def clean(s):
    return re.sub(r"\s+", " ", str(s or "")).strip()


def load(parquet, limit):
    df = pd.read_parquet(parquet)
    df["question"] = df["question"].map(clean)
    df["answer"] = df["answer"].map(clean)
    df = df[(df["answer"].str.len() > 40) & (df["question"].str.len() > 5)]
    df = df.drop_duplicates(subset=["question", "answer"]).reset_index(drop=True)
    if limit:
        df = df.head(limit)
    return df


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--parquet", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--backend", default="fastembed", choices=["fastembed", "st"],
                    help="st = sentence-transformers on GPU for a fast build; queries still use fastembed")
    ap.add_argument("--threads", type=int, default=int(os.environ.get("SLURM_CPUS_PER_TASK", 4)))
    args = ap.parse_args()

    df = load(args.parquet, args.limit)
    print(f"{len(df)} Q&A pairs after cleaning", flush=True)

    docs = [f"{q}\n{a}" for q, a in zip(df["question"], df["answer"])]
    metas = [dict(title=q, url=clean(u), source=clean(s), focus=clean(f), qtype=clean(t))
             for q, u, s, f, t in zip(df["question"], df["document_url"], df["document_source"],
                                      df["question_focus"], df["question_type"])]
    ids = [f"mq{i}" for i in range(len(df))]

    t = time.time()
    if args.backend == "st":
        import numpy as np
        from sentence_transformers import SentenceTransformer
        st = SentenceTransformer(MODEL, device="cuda")
        st.max_seq_length = 512
        V = st.encode(docs, batch_size=256, normalize_embeddings=True, convert_to_numpy=True, show_progress_bar=False)
        vecs = V.tolist()
        # parity check against the runtime embedder (fastembed) on a sample
        fe = TextEmbedding(MODEL, threads=args.threads)
        F = np.array(list(fe.embed(docs[:300])))
        F /= np.linalg.norm(F, axis=1, keepdims=True)
        cos = (V[:300] * F).sum(1)
        print(f"parity ST(GPU) vs fastembed on 300 docs: min {cos.min():.4f} mean {cos.mean():.4f}", flush=True)
    else:
        emb = TextEmbedding(MODEL, threads=args.threads)
        vecs = []
        for i, v in enumerate(emb.embed(docs, batch_size=128)):
            vecs.append(v.tolist())
            if (i + 1) % 5000 == 0:
                print(f"  embedded {i+1}/{len(docs)}  {(i+1)/(time.time()-t):.0f}/s", flush=True)
    print(f"embedded {len(vecs)} docs in {time.time()-t:.0f}s", flush=True)

    client = chromadb.PersistentClient(path=args.out)
    try:
        client.delete_collection(COLLECTION)
    except Exception:
        pass
    col = client.create_collection(COLLECTION, metadata={"hnsw:space": "cosine", "embed_model": MODEL})
    step = min(5000, client.get_max_batch_size())
    for s in range(0, len(ids), step):
        col.add(ids=ids[s:s+step], documents=docs[s:s+step], metadatas=metas[s:s+step], embeddings=vecs[s:s+step])
    print(f"collection '{COLLECTION}' count = {col.count()}", flush=True)

    json.dump(dict(collection=COLLECTION, embed_model=MODEL, embed_library="fastembed",
                   query_prefix=QUERY_PREFIX, distance="cosine", count=col.count(),
                   chromadb_version=chromadb.__version__, source="lavita/MedQuAD (NIH)"),
              open(os.path.join(args.out, "index_info.json"), "w"), indent=2)


if __name__ == "__main__":
    main()
