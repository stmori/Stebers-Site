"""Retrieval over the persisted MedQuAD Chroma index (built by scripts/build_index.py)."""
import json
import os

import chromadb
from fastembed import TextEmbedding

from . import config


class Retriever:
    def __init__(self, index_dir=config.INDEX_DIR):
        self.info = json.load(open(os.path.join(index_dir, "index_info.json"), encoding="utf-8"))
        self.embedder = TextEmbedding(self.info["embed_model"], cache_dir=config.FASTEMBED_CACHE, threads=2)
        self.collection = chromadb.PersistentClient(path=index_dir).get_collection(self.info["collection"])

    def count(self):
        return self.collection.count()

    def search(self, text, k=config.TOP_K):
        vec = next(iter(self.embedder.embed([self.info["query_prefix"] + text]))).tolist()
        r = self.collection.query(query_embeddings=[vec], n_results=k,
                                  include=["documents", "metadatas", "distances"])
        hits = []
        for doc, meta, dist in zip(r["documents"][0], r["metadatas"][0], r["distances"][0]):
            answer = doc.split("\n", 1)[1] if "\n" in doc else doc
            hits.append(dict(title=meta.get("title", ""), url=meta.get("url", ""),
                             source=meta.get("source", ""), text=answer, score=round(1 - dist, 3)))
        return hits
