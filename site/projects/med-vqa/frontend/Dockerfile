# Built with site/projects/med-vqa as the context (docker-compose.yml). Static Next.js export served by Caddy,
# which also proxies /api to the FastAPI container.
FROM node:20-alpine AS build
WORKDIR /app
COPY frontend/package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY frontend/ ./
RUN npm run build

FROM caddy:2-alpine
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/out /srv
