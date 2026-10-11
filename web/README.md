# web

The Med-VQA frontend (Next.js + Tailwind). Each URL is a folder under `app/` with a `page.tsx`:

```
app/projects/med-vqa/page.tsx         /projects/med-vqa/   Med-VQA chat (dark)
app/projects/med-vqa/components/      ChatThread, Composer, AnswerCard, LoadingSteps
app/projects/med-vqa/lib/             API client (POST /api/med-vqa/ask), types, mock mode, examples, drag-and-drop hook
public/projects/med-vqa/examples/     example images
```

The home page and Jake's portfolio are generated from `../projects/` (content only) at build time:

```
app/page.tsx                          /                    one section per project in projects/<person>/, newest first
app/lib/projects.ts                   shared loader: front matter, media URLs, home page sections
app/jake/page.tsx                     /jake/               profile + project cards
app/jake/[slug]/page.tsx              /jake/<slug>/        one page per project folder (published: true)
app/jake/lib/content.ts               reads project.md / profile.md (YAML front matter + Markdown)
scripts/copy-project-media.mjs        copies projects/<person>/*/media/ to public/media/ before dev/build (gitignored)
```

Only `page.tsx` files become URLs, so a project's own components and helpers live next to its page.

## Run it

```bash
cd web
cp .env.example .env.local      # NEXT_PUBLIC_MOCK=1 = fake Med-VQA answers, no backend needed
npm install                     # commit the package-lock.json this creates
npm run dev                     # http://localhost:3000/projects/med-vqa/
```

Against the real Med-VQA API: run the stack (`deploy/`), then set `NEXT_PUBLIC_MOCK=0` and `NEXT_PUBLIC_MEDVQA_API=http://localhost:8000/api` in `.env.local`, and `CORS_ORIGINS=http://localhost:3000` in `deploy/.env`.

In Docker the site is a static export (`npm run build` → `out/`) served by Caddy, so no Node server runs in production.
