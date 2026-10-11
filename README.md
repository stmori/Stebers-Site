# Steber's Website

Jake and Evanton's website: a shared landing page, a portfolio page for each of us (research and projects), and the projects themselves, including **Med-VQA** (Knight Hacks 2026).

## Layout

Folders are split by what gets deployed, not by URL. The website is one app; each project's backend is its own service next to it.

```
web/                            # frontend (Next.js)                                — Evanton
└── app/projects/med-vqa/         /projects/med-vqa/   (chat UI: page.tsx + its components/ and lib/)
services/
├── med-vqa-api/                # FastAPI + ChromaDB retrieval, index scripts         — Jake
└── med-vqa-inference/          # vision model on the CRCV cluster (bare-metal)       — Jake
projects/                       # project content, one folder per person (home page + portfolios read it)
└── jake/                       #   Jake's profile + one folder per project (project.md + media/);
                                #   see projects/jake/README.md — Jake
deploy/
├── docker-compose.yml          # web + every API on one network                      — shared
├── Caddyfile                   # /  → website,  /api/med-vqa/*  → med-vqa-api
└── .env.example
```

- **Evanton** owns `web/`, hosting and the domain.
- **Jake** owns `services/med-vqa-*` and `projects/jake/` (portfolio content; `web/` decides how it looks).
- `deploy/` is shared: change it in a PR and tag the other person.

Med-VQA appears on Jake's portfolio card and on its own page, `/projects/med-vqa/`. That page calls the API at `/api/med-vqa/...`; the contract is in `services/med-vqa-api/README.md`. A new project gets a page in `web/app/projects/<name>/` and, if it has a backend, a folder in `services/` plus a route in `deploy/Caddyfile`.

## Run everything

```bash
cp deploy/.env.example deploy/.env      # MOCK_LLM=1 runs without an API key; unpack the index first (services/med-vqa-api/README.md)
cd deploy && docker compose up --build  # http://localhost
```

For UI work only: `cd web && npm install && npm run dev` (see `web/README.md`).

## Working together

Read [CONTRIBUTING.md](CONTRIBUTING.md). In short: branch off `main`, push the branch, open a pull request, and the other person merges it. Never commit secrets.
