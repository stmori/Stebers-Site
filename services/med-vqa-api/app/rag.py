"""Retrieval over the persisted MedQuAD Chroma index (built by scripts/build_index.py)."""
import json
import os

import chromadb
from fastembed import TextEmbedding

from . import config

LOW_VALUE = "Human Phenotype Ontology provides the following list"


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

        self.cases = None
        if self.info.get("cases_collection"):            # optional: similar past chest X-ray reports (Open-I)
            try:
                self.cases = chromadb.PersistentClient(path=index_dir).get_collection(self.info["cases_collection"])
            except Exception:
                self.cases = None

    def count(self):
        return self.collection.count()

    def cases_count(self):
        return self.cases.count() if self.cases else 0

    def similar_cases(self, findings_text, k=config.CASES_K, min_score=config.CASES_MIN_SCORE):
        """Most similar past chest X-ray reports (text only) to the model's findings."""
        if not self.cases or k <= 0:
            return []
        vec = next(iter(self.embedder.embed([self.info["query_prefix"] + findings_text]))).tolist()
        r = self.cases.query(query_embeddings=[vec], n_results=k * 2, include=["metadatas", "distances"])
        out = []
        for m, d in zip(r["metadatas"][0], r["distances"][0]):
            if 1 - d >= min_score and len(out) < k:
                out.append(dict(uid=m["uid"], problems=m.get("problems", ""), impression=m.get("impression", ""),
                                findings=m.get("findings", "")[:400], score=round(1 - d, 3)))
        return out

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
            if LOW_VALUE in hit["text"]:                 # GARD/GHR pages that are only a symptom-frequency table
                return False
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
