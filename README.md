# Steber's Website

Jake and Evanton's website: a shared landing page, a portfolio page for each of us (research and projects), and the projects themselves, including **Med-VQA** (Knight Hacks 2026).

## Layout

```
/
├── site/                 # the website (landing page, /jake, /evanton, project pages)   — Evanton
└── projects/
    └── med-vqa/          # Med-VQA: API, retrieval, deploy files, reference UI          — Jake
```

- **Evanton** owns `site/` plus hosting and the domain.
- **Jake** owns `projects/med-vqa/`.
- Changes to the other person's folder go through them in the PR review.

Med-VQA appears twice on the site: as a card on Jake's portfolio page and on its own page. That page calls the Med-VQA API at `/api/...`; the API contract is in `projects/med-vqa/README.md`.

## Working together

Read [CONTRIBUTING.md](CONTRIBUTING.md). In short: branch off `main`, push the branch, open a pull request, and the other person merges it. Never commit secrets.
