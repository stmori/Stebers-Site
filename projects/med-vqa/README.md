# Med-VQA

Upload a medical image (X-ray, CT, MRI, histology), ask a question, and get an answer grounded in NIH sources with numbered citations. Built at Knight Hacks 2026.

> Educational demo only. Not medical advice and not a diagnosis.

## How it works

```
browser ──HTTPS──▶ web (Caddy: TLS, static site, /api proxy) ──▶ api (FastAPI)
                                                                   ├─ 1. vision model: image + question → JSON findings
                                                                   ├─ 2. ChromaDB search over MedQuAD (16,346 NIH Q&A, fastembed bge-small)
                                                                   └─ 3. language model: findings + top-5 passages → answer with [n] citations
```

- **Model:** Claude Haiku 5.5 (`claude-haiku-5-5`) through the Anthropic API by default: cheap (about $0.10 / $0.50 per million input/output tokens), fast, reads images, and returns schema-guaranteed JSON for the findings step. Set `PROVIDER=openai` to use OpenAI or any OpenAI-compatible server instead (`OPENAI_BASE_URL`); we tested that path against Lingshu-7B on vLLM.
- **Knowledge base:** MedQuAD (NIH: MedlinePlus, GARD, GHR, NHLBI, …). Every citation links to its source page.
- **Privacy:** images are resized and re-encoded in memory (metadata stripped), never written to disk or logged. They are sent to the model provider.
- **Abuse limits:** per-IP rate limit (6/min, 60/day by default), 8 MB image cap, 500-character question cap.

## API

`POST /api/ask` (multipart: `image`, `question`) →

```json
{
  "findings": {"is_medical_image": true, "modality": "Chest X-ray (PA)", "body_region": "Chest",
               "observations": ["..."], "short_answer": "..."},
  "answer": "... [1] ... [2]",
  "citations": [{"n": 1, "title": "...", "url": "https://...", "source": "...", "snippet": "...", "score": 0.79, "cited": true}],
  "disclaimer": "...", "model": "claude-haiku-5-5",
  "timings_ms": {"vision": 3100, "retrieval": 40, "answer": 2800}
}
```

Errors: `400` bad image or question, `422` the model declined to answer, `429` rate limited, `502` model unavailable. All return `{"error": "<message for the user>"}`.

`GET /api/health` → `{"status": "ok", "provider": "anthropic", "model": "claude-haiku-5-5", "mock": false, "llm_configured": true, "index_passages": 16346}`. Interactive docs at `/api/docs`.

## Run locally

```bash
cp .env.example .env                      # add ANTHROPIC_API_KEY, or set MOCK_LLM=1 to run without a key
mkdir -p index && tar xzf index_medquad.tar.gz && mv index_medquad/* index/ && rmdir index_medquad
sudo chown -R 1000:1000 index           # Linux only (the app runs as user 1000 and must be able to write here)
docker compose up --build                 # http://localhost
```

The backup UI (plain HTML in `fallback-ui/`) runs with `WEB_DOCKERFILE=deploy/web-fallback.Dockerfile` in `.env`. The Next.js frontend uses `deploy/frontend.Dockerfile` copied to `frontend/Dockerfile`, with `output: "export"` in `next.config`.

## Deploy (Ubuntu VPS + your domain)

1. Create an Ubuntu 24.04 VPS (2 vCPU / 4 GB is plenty) and note its IP.
2. At your registrar (Porkbun), delete the default parking records, then add `A @ → <IP>` and `A www → <IP>`.
3. On the VPS:
   ```bash
   git clone <repo> /opt/medvqa && cd /opt/medvqa && bash deploy/setup_vps.sh
   # copy index_medquad.tar.gz here (scp), unpack into ./index as above, then: chown -R 1000:1000 index
   cp .env.example .env && nano .env        # ANTHROPIC_API_KEY, DOMAIN="yourdomain.tech, www.yourdomain.tech"
   docker compose up -d --build
   ```
4. Once `dig +short yourdomain.tech` returns the IP, Caddy issues the HTTPS certificate on the first request.

Updates: `git pull && docker compose up -d --build`. Logs: `docker compose logs -f api`.

## Rebuild the index

`scripts/build_index.py --parquet <MedQuAD parquet> --out index --backend st` (GPU, ~2.5 min) or `--backend fastembed` (CPU, slow). Queries must use the same embedding model (`index/index_info.json`).

## Data and licenses

- MedQuAD (Ben Abacha & Demner-Fushman, 2019), NIH sources; answers removed upstream for copyrighted subsets were dropped.
- Example images: VQA-RAD (CC0) and Open-I / Indiana University chest X-rays.
