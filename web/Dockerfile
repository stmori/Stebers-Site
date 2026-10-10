# The website: Next.js static export served by Caddy, which also routes /api/<project>/* to each project's API.
# Built from the repo root (see deploy/docker-compose.yml).
FROM node:20-alpine AS build
WORKDIR /app
COPY web/package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY web/ ./
# Jake's portfolio content (rendered at /jake/); the loader reads it from ../jake_projects
COPY jake_projects/ /jake_projects/
RUN npm run build

FROM caddy:2-alpine
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/out /srv
