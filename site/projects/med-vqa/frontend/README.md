# Med-VQA frontend

Next.js + Tailwind app for Med-VQA: drop in a medical image, ask questions about it in a chat, and get answers with numbered links to NIH sources. The image stays attached, so follow-up questions are about the same image. Talks to the backend through `POST /api/ask` (contract in `../README.md`).

## Run it

```bash
cd site/projects/med-vqa/frontend
cp .env.example .env.local      # NEXT_PUBLIC_MOCK=1 = fake answers, no backend needed
npm install                     # commit the package-lock.json this creates
npm run dev                     # http://localhost:3000
```

Against the real API: set `NEXT_PUBLIC_MOCK=0` and `NEXT_PUBLIC_API_BASE=http://localhost:8000` in `.env.local`, and `CORS_ORIGINS=http://localhost:3000` in the backend's `.env`.

In Docker, `docker compose up --build` from `site/projects/med-vqa/` builds this app (`frontend/Dockerfile`) as a static export that Caddy serves, with `/api` proxied to FastAPI, so no env vars are needed.

## Layout

```
app/page.tsx              the page: image panel + conversation + composer
components/ImageDropzone  drag and drop / click to choose, preview, replace, remove
components/ChatThread     question and answer bubbles, error + retry
components/LoadingSteps   "Reading the image → Searching NIH sources → Writing" while waiting
components/AnswerCard     answer with clickable [n] citations, what the model saw, sources
components/Composer       question box (Enter sends, Shift+Enter new line, 500-char limit)
lib/api.ts                the /api/ask call, client-side checks, mock mode
lib/types.ts              response types matching the API
```

To serve it inside the main site at `/projects/med-vqa/`, build with `NEXT_PUBLIC_BASE_PATH=/projects/med-vqa`.
