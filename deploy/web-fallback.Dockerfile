# Backup UI for Med-VQA (plain HTML/JS), same Caddy setup. Use with WEB_DOCKERFILE=deploy/web-fallback.Dockerfile
# Built from the repo root. Serves the backup UI at / instead of the website.
FROM caddy:2-alpine
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY services/med-vqa-api/fallback-ui/ /srv
