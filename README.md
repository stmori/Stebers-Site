# Steber's Website

Jake and Evanton's website: a shared landing page, a portfolio page for each of us (research and projects), and the projects themselves, including **Med-VQA** (Knight Hacks 2026).

## Layout

```
site/                           # the website root
├── index.html                  # home page                                      /
├── assets/site.css             # shared styles for the plain-HTML pages
└── projects/
    ├── index.html              # projects page                                  /projects/
    └── med-vqa/                # Med-VQA page                                   /projects/med-vqa/
        ├── frontend/           # Next.js app (upload, chat, citations)          — Evanton
        ├── backend/            # FastAPI + ChromaDB retrieval                    — Jake
        ├── deploy/ scripts/    # Caddy, VPS setup, index build, cluster tests    — Jake
        └── docker-compose.yml
```

- **Evanton** owns the site pages (`site/index.html`, `site/projects/index.html`, `site/assets/`), `site/projects/med-vqa/frontend/`, hosting and the domain.
- **Jake** owns the rest of `site/projects/med-vqa/` (backend, deploy, scripts).
- Changes to the other person's folder go through them in the PR review.

Med-VQA appears twice on the site: as a card on Jake's portfolio page and on its own page. That page calls the Med-VQA API at `/api/...`; the API contract is in `site/projects/med-vqa/README.md`.

## Working together

Read [CONTRIBUTING.md](CONTRIBUTING.md). In short: branch off `main`, push the branch, open a pull request, and the other person merges it. Never commit secrets.
