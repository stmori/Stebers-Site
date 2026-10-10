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
        try:
            self.collection = chromadb.PersistentClient(path=index_dir).get_collection(self.info["collection"])
        except Exception as e:
            if "readonly" in str(e).lower() or "read-only" in str(e).lower():
                raise RuntimeError(f"The index folder {index_dir} must be writable by the app (ChromaDB writes lock files "
                                   f"even when reading). On a Linux server run: sudo chown -R 1000:1000 index") from e
            raise

    def count(self):
        return self.collection.count()

    def _ranked(self, queries, k):
        vecs = [v.tolist() for v in self.embedder.embed([self.info["query_prefix"] + q for q in queries])]
        r = self.collection.query(query_embeddings=vecs, n_results=k, include=["documents", "metadatas", "distances"])
        out = []
        for docs, metas, dists in zip(r["documents"], r["metadatas"], r["distances"]):
            out.append([dict(title=m.get("title", ""), url=m.get("url", ""), source=m.get("source", ""),
                             text=d.split("\n", 1)[1] if "\n" in d else d, score=round(1 - s, 3))
                        for d, m, s in zip(docs, metas, dists)])
        return out

    def search(self, text, k=config.TOP_K):
        return self._ranked([text], k)[0]

    def search_many(self, queries, k=config.TOP_K, per_query=4, min_score=config.MIN_SCORE, max_per_url=2):
        """Search each query separately and interleave the results, so every search term is represented.

        Skips duplicates, matches below min_score (but always returns at least 3 passages), and more than
        max_per_url passages from the same source page.
        """
        queries = [q for q in dict.fromkeys(q.strip() for q in queries) if q][:6]
        lists = self._ranked(queries, per_query)
        picked, titles, per_url = [], set(), {}

        def take(hit, floor):
            if hit["title"] in titles or hit["score"] < floor or per_url.get(hit["url"], 0) >= max_per_url:
                return False
            picked.append(hit); titles.add(hit["title"]); per_url[hit["url"]] = per_url.get(hit["url"], 0) + 1
            return True

        for floor in (min_score, -1.0):                 # second pass only if too few strong matches
            for rank in range(per_query):
                for lst in lists:
                    if len(picked) >= k or (floor < 0 and len(picked) >= 3):
                        break
                    if rank < len(lst):
                        take(lst[rank], floor)
            if len(picked) >= 3:
                break
        return picked
