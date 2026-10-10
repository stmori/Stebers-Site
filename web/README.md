# web

The whole website as one Next.js + Tailwind app. Each URL is a folder under `app/`. Folders in parentheses are route groups: they pick the page frame and are not part of the URL.

```
app/(site)/page.tsx                            /                    home (with nav bar + footer)
app/(site)/projects/page.tsx                   /projects/           project list (from lib/projects.ts)
app/(fullscreen)/projects/med-vqa/page.tsx     /projects/med-vqa/   Med-VQA chat (full screen, dark)
components/                                    shared: SiteNav, ProjectCard
components/med-vqa/                            Med-VQA UI: MedVqa (page), ChatThread, Composer, LoadingSteps, AnswerCard
lib/med-vqa/                                   API client (POST /api/med-vqa/ask), types, mock mode, examples, window drag-and-drop hook
public/projects/med-vqa/examples/ example images
```

## Run it

```bash
cd web
cp .env.example .env.local      # NEXT_PUBLIC_MOCK=1 = fake Med-VQA answers, no backend needed
npm install                     # commit the package-lock.json this creates
npm run dev                     # http://localhost:3000
```

Against the real Med-VQA API: run the stack (`deploy/`), then set `NEXT_PUBLIC_MOCK=0` and `NEXT_PUBLIC_MEDVQA_API=http://localhost:8000/api` in `.env.local`, and `CORS_ORIGINS=http://localhost:3000` in `deploy/.env`.

## Add a project page

1. Add an entry to `lib/projects.ts` (it shows up on `/projects` and, if `featured`, on the home page).
2. Create `app/(site)/projects/<slug>/page.tsx` (or under `(fullscreen)` for an app-style page). Put its components in `components/<slug>/`.
3. If it has a backend, add it under `services/<slug>-api/`, add the container to `deploy/docker-compose.yml`, and route `/api/<slug>/*` to it in `deploy/Caddyfile`.

In Docker the site is a static export (`npm run build` → `out/`) served by Caddy, so no Node server runs in production.
