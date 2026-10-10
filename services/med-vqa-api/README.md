# Med-VQA

Upload a medical image (X-ray, CT, MRI, histology), ask a question, and get an answer grounded in NIH sources with numbered citations. Built at Knight Hacks 2026.

> Educational demo only. Not medical advice and not a diagnosis.

## How it works

```
browser ──HTTPS──▶ web (Caddy: TLS, static site, /api/med-vqa/* proxy) ──▶ med-vqa-api (FastAPI)
                                                                   ├─ 1. vision model: image + question → JSON findings
                                                                   ├─ 2. ChromaDB search over MedQuAD (16,346 NIH Q&A, fastembed bge-small)
                                                                   └─ 3. language model: findings + top-5 passages → answer with [n] citations
```

- **Model:** Claude Haiku 5.5 (`claude-haiku-5-5`) through the Anthropic API by default: cheap (about $0.10 / $0.50 per million input/output tokens), fast, reads images, and returns schema-guaranteed JSON for the findings step. Set `PROVIDER=openai` to use OpenAI or any OpenAI-compatible server instead (`OPENAI_BASE_URL`); we tested that path against Lingshu-7B on vLLM.
- **Knowledge base:** MedQuAD (NIH: MedlinePlus, GARD, GHR, NHLBI, …). Every citation links to its source page.
- **Privacy:** images are resized and re-encoded in memory (metadata stripped), never written to disk or logged. They are sent to the model provider.
- **Abuse limits:** per-IP rate limit (6/min, 60/day by default), 8 MB image cap, 500-character question cap.

## API

The container serves `/api/...`. Through Caddy the public paths are `/api/med-vqa/...` (Caddy rewrites `/api/med-vqa/x` to `/api/x`), so the website calls `POST /api/med-vqa/ask`.

`POST /api/ask`, multipart form:

| field | required | meaning |
|---|---|---|
| `image` | yes | PNG, JPEG, WebP or DICOM (`.dcm`), ≤ 8 MB. DICOM headers are discarded. |
| `question` | yes | 3–500 characters |
| `history` | no | JSON list of earlier `{"question", "answer"}` turns about the same image (last 3 used) |
| `analyze_nuclei` | no | `true` runs the nuclei tool (H&E histology only; see below) |

Response:

```json
{
  "findings": {"is_medical_image": true, "modality": "Chest X-ray (PA)", "body_region": "Chest",
               "observations": ["..."], "short_answer": "...", "search_terms": ["pneumonia", "pleural effusion"]},
  "answer": "Yes ... most likely pneumonia [1] ...",
  "citations": [{"n": 1, "title": "...", "url": "https://...", "source": "...", "snippet": "...", "score": 0.79, "cited": true}],
  "similar_cases": [{"uid": 1740, "problems": "...", "impression": "...", "findings": "...", "score": 0.88}],
  "analysis": {"nuclei": {"status": "ok", "count": 57, "coverage_pct": 12.4, "density": "moderate",
                          "mean_area_px": 1180.5, "message": "...",
                          "overlay": "data:image/jpeg;base64,..."}},
  "disclaimer": "...", "model": "claude-haiku-5-5", "cached": false,
  "timings_ms": {"vision": 3100, "nuclei": 900, "retrieval": 40, "answer": 2800}
}
```

- `similar_cases` is filled only for chest X-rays.
- `analysis` is `{}` unless `analyze_nuclei=true`. When the tool can't run, `analysis.nuclei.status` is `not_applicable` (not H&E histology), `no_nuclei`, or `unavailable` (model file not installed), and `message` explains why.
- `cached: true` means an identical earlier request was answered instantly.

Errors: `400` bad image or question, `422` the model declined to answer, `429` rate limited, `502` model unavailable. All return `{"error": "<message for the user>"}`.

`GET /api/health` → `{"status": "ok", "provider": "anthropic", "model": "claude-haiku-5-5", "mock": false, "llm_configured": true, "index_passages": 16346, "index_cases": 3818, "nuclei_tool": true, "cached_answers": 0}`. Interactive docs at `/api/docs` only when `DOCS=1` is set (off by default, since Caddy forwards every `/api/med-vqa/*` path).

## Nuclei analysis tool (optional)

`app/tools/nuclei.py` runs Jake's **LoRA-fine-tuned MobileSAM** (rank-4 LoRA on the TinyViT encoder, trained on NuInsSeg, merged and exported to ONNX) on CPU with ONNX Runtime; no PyTorch in the container.

- **When it runs:** only if the request sets `analyze_nuclei=true` **and** the vision model says the image is histology (H&E, pathology, tissue section, …). Otherwise it reports `not_applicable` and the question is still answered normally.
- **What it does:** resizes to 1024×1024 and makes one prompt-free forward pass (~1 s on CPU). Then light smoothing of the logits, sigmoid > 0.5, connected components (blobs < 30 px dropped) and a distance-transform watershed that splits touching nuclei give an approximate nucleus count and the area coverage (cellularity: sparse < 8%, moderate < 20%, dense; these cut-offs are the ground-truth tertiles). Nuclear size variation is deliberately **not** reported: on held-out tiles the model's size spread didn't correlate with the ground truth's, so it would be a misleading atypia signal. Agreement with the ground truth on the 133 held-out fold-1 tiles: coverage r = 0.87, count r = 0.70 (median predicted/true 0.97); standard AJI 0.40, PQ 0.34, Dice 0.72. It also builds an overlay image with outlined nuclei. The measurements are passed to the answer model as evidence.
- **How the answer reports it:** the server always appends one standard line to the answer (`Nuclei analysis (LoRA MobileSAM): Found 14 nuclei …` or `Nuclei analysis: … wasn't run on this chest X-ray.`), and drops any sentence where the model restated the tool output, so the result appears exactly once.
- **Model file:** `nuclei_lora.onnx` (52 MB; the 30-epoch retrain, fold-1 Dice 0.72) lives **in the index folder** (`/index/nuclei_lora.onnx`, override with `NUCLEI_MODEL`), so it ships with the index tarball. If it's missing, the API still works and the tool reports `unavailable`.
- **Server size:** the API process uses ~0.45 GB RAM idle and peaks at ~1.15 GB while the nuclei tool runs (~2 s per image on 2 vCPUs). Use a server with **at least 2 GB RAM** (e.g. a 2 GB DigitalOcean droplet or a Hetzner CX22); on 1 GB the tool can get the container OOM-killed.
- **Training and export:** see the LoRA project (`jake_projects/lora-mobilesam-nuclei/`); the export script bakes the constant empty prompt into the ONNX graph.

## Run locally

From the repo root:

```bash
cp deploy/.env.example deploy/.env        # add ANTHROPIC_API_KEY, or set MOCK_LLM=1 to run without a key
mkdir -p services/med-vqa-api/index && tar xzf index_medquad.tar.gz \
  && mv index_medquad/* services/med-vqa-api/index/ && rmdir index_medquad
sudo chown -R 1000:1000 services/med-vqa-api/index   # Linux only: the app runs as user 1000 and must be able to write here
cd deploy && docker compose up --build    # http://localhost/projects/med-vqa/
```

The backup UI (plain HTML in `fallback-ui/`) runs with `WEB_DOCKERFILE=deploy/web-fallback.Dockerfile` in `deploy/.env`. The main UI is the `/projects/med-vqa` page of the website in `web/`.

## Deploy (Ubuntu VPS + your domain)

1. Create an Ubuntu 24.04 VPS (2 vCPU / 4 GB is plenty) and note its IP.
2. At your registrar (Porkbun), delete the default parking records, then add `A @ → <IP>` and `A www → <IP>`.
3. On the VPS:
   ```bash
   git clone <repo> /opt/stebers-site && cd /opt/stebers-site && bash deploy/setup_vps.sh
   # copy index_medquad.tar.gz here (scp), unpack into services/med-vqa-api/index as above, then: chown -R 1000:1000 services/med-vqa-api/index
   cp deploy/.env.example deploy/.env && nano deploy/.env   # ANTHROPIC_API_KEY, DOMAIN="yourdomain.tech, www.yourdomain.tech"
   cd deploy && docker compose up -d --build
   ```
4. Once `dig +short yourdomain.tech` returns the IP, Caddy issues the HTTPS certificate on the first request.

Updates: `git pull && cd deploy && docker compose up -d --build`. Logs: `docker compose logs -f med-vqa-api`.

## Rebuild the index

`scripts/build_index.py --parquet <MedQuAD parquet> --out index --backend st` (GPU, ~2.5 min) or `--backend fastembed` (CPU, slow). Queries must use the same embedding model (`index/index_info.json`).

## Data and licenses

- MedQuAD (Ben Abacha & Demner-Fushman, 2019), NIH sources; answers removed upstream for copyrighted subsets were dropped.
- Example images: VQA-RAD (CC0) and Open-I / Indiana University chest X-rays.
- Similar cases: Indiana University chest X-ray reports via Open-I (NLM), report text only.
- Nuclei model: MobileSAM (Apache-2.0) fine-tuned with LoRA on NuInsSeg (Mahbod et al., CC BY 4.0).
