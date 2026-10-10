# Deploying the site

One VPS runs everything with Docker Compose: **Caddy** (HTTPS, the static website, `/api/<project>/*` routing) and the
**Med-VQA API**. About 45 minutes the first time, most of it waiting on DNS and the first build.

## What you need

| Item | Who has it | Notes |
|---|---|---|
| The domain (Porkbun) | Evanton | DNS records point at the server |
| A VPS, Ubuntu 24.04, **≥ 2 GB RAM** | Evanton | e.g. DigitalOcean 2 GB ($12/mo) or Hetzner CX22. 1 GB isn't enough: the API peaks at ~1.15 GB with the nuclei tool |
| `index_medquad.tar.gz` (159 MB) | Jake | RAG index + nuclei model. sha256 `253aa769c20dc4f8bcf8733fcfe8c0f5b3391ba6b6d2d6a342ca010bf31ddc21` |
| Anthropic API key `medvqa-server` | Jake | Typed into `deploy/.env` on the server only. Never commit it or paste it in chat |

## 1. DNS (Porkbun → Domain → DNS)

1. **Delete Porkbun's default parking records** (an `ALIAS` on the root and a `CNAME *`, both pointing to
   `pixie.porkbun.com`). Left in place, they keep the domain on the parking page and HTTPS certificates fail.
2. Add `A` record, host empty (root) → server IPv4. Add `A` record, host `www` → same IP.
3. Check from any terminal: `nslookup yourdomain.tech` (or `dig +short yourdomain.tech`) shows the server IP.
   Usually 1–10 minutes.

## 2. Server setup (once)

```bash
ssh root@SERVER_IP
git clone https://github.com/stmori/Stebers-Site.git /opt/stebers-site
cd /opt/stebers-site && bash deploy/setup_vps.sh      # Docker, firewall (22/80/443), auto security updates, 2 GB swap
```

## 3. Index + nuclei model

From the laptop (PowerShell or MobaXterm), in the folder with the tarball:

```bash
scp index_medquad.tar.gz root@SERVER_IP:/opt/stebers-site/
```

On the server:

```bash
cd /opt/stebers-site
sha256sum index_medquad.tar.gz                        # must match the sha256 above
mkdir -p services/med-vqa-api/index && tar xzf index_medquad.tar.gz \
  && mv index_medquad/* services/med-vqa-api/index/ && rmdir index_medquad
ls services/med-vqa-api/index                          # chroma.sqlite3, index_info.json, nuclei_lora.onnx, 2 folders
chown -R 1000:1000 services/med-vqa-api/index          # the API runs as uid 1000 and ChromaDB needs write access
```

## 4. Secrets and domain

```bash
cp deploy/.env.example deploy/.env && chmod 600 deploy/.env && nano deploy/.env
```

Set:
- `DOMAIN=yourdomain.tech, www.yourdomain.tech`
- `ANTHROPIC_API_KEY=` + the `medvqa-server` key
- `MOCK_LLM=0`

Leave the rest as is. The rate limits (6/min, 60/day per IP) and the Console's prepaid credit with auto-reload off cap the spend.

## 5. Start

```bash
cd /opt/stebers-site/deploy && docker compose up -d --build     # first build ~5–10 min
docker compose ps                                              # both services "running"
docker compose logs --tail 30 med-vqa-api                      # "nuclei tool: ready", no tracebacks
```

## 6. Check it

| Check | Expected |
|---|---|
| `curl -s https://yourdomain.tech/api/med-vqa/health` | `"llm_configured":true`, `"mock":false`, `"index_cases":3818`, `"nuclei_tool":true` |
| `https://yourdomain.tech/` | Home page, padlock (valid certificate) |
| `https://www.yourdomain.tech/` | Same site |
| `/projects/med-vqa/` → click the chest X-ray example | Cited answer in ~6 s |
| `/projects/med-vqa/` → click the H&E example | Toggle switches to "Nuclei on"; answer + overlay panel (about 95 nuclei, dense cellularity) |
| `/jake/` and a project page | Portfolio renders, images load |
| `https://yourdomain.tech/nope` | 404 page |

## Updating

```bash
cd /opt/stebers-site && git pull && cd deploy && docker compose up -d --build
```

The index folder and `.env` are not in git, so pulls never touch them. To ship a new index or nuclei model, replace
the folder contents, `chown -R 1000:1000` again, then `docker compose restart med-vqa-api`.

## Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| Browser shows Porkbun parking page | Parking records still there (step 1), or DNS not propagated yet |
| Certificate error / Caddy logs `challenge failed` | DNS doesn't point at this server yet, or ports 80/443 closed. Fix DNS, then `docker compose restart web` |
| `502` on `/api/med-vqa/*` | API still starting (loads the index, ~20 s) or crashed: `docker compose logs med-vqa-api` |
| API log: `attempt to write a readonly database` | `chown -R 1000:1000 services/med-vqa-api/index` |
| Answers say "Mock answer" | `MOCK_LLM=0` in `.env`, then `docker compose up -d` |
| "The AI model is unavailable" | Key wrong or credit used up. Check console.anthropic.com → Usage |
| Container restarts, `dmesg` shows OOM | Server too small; use ≥ 2 GB RAM |
