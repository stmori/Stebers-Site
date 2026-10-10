# Backup UI (plain HTML/JS in fallback-ui/), same Caddy setup. Use with WEB_DOCKERFILE=deploy/web-fallback.Dockerfile
FROM caddy:2-alpine
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY fallback-ui/ /srv
