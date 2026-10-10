"""Reopen the persisted index from scratch (like the backend will) and run sample queries."""
import json, sys, time
import chromadb
from fastembed import TextEmbedding

path = sys.argv[1]
info = json.load(open(f"{path}/index_info.json"))
emb = TextEmbedding(info["embed_model"], threads=4)
col = chromadb.PersistentClient(path=path).get_collection(info["collection"])
print("count", col.count())
qs = ["Chest X-ray shows right upper lobe consolidation. What does this mean?",
      "What are the symptoms of pneumothorax?",
      "Brain MRI with a ring-enhancing lesion, what could it be?",
      "How is cardiomegaly treated?",
      "What causes a pleural effusion?"]
for q in qs:
    t = time.time()
    v = next(iter(emb.embed([info["query_prefix"] + q]))).tolist()
    r = col.query(query_embeddings=[v], n_results=3, include=["metadatas", "distances"])
    ms = (time.time() - t) * 1000
    print(f"\nQ: {q}   ({ms:.0f} ms)")
    for m, d in zip(r["metadatas"][0], r["distances"][0]):
        print(f"   {1-d:.3f}  {m['title'][:80]}  <{m['url']}>")
