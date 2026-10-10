#!/usr/bin/env bash
# One-time setup on a fresh Ubuntu 24.04 VPS (run as root):  bash setup_vps.sh
set -euo pipefail
apt-get update && apt-get -y upgrade
apt-get install -y ca-certificates curl git ufw unattended-upgrades
dpkg-reconfigure -f noninteractive unattended-upgrades
curl -fsSL https://get.docker.com | sh          # Docker Engine + compose plugin
systemctl enable --now docker
ufw allow OpenSSH && ufw allow 80/tcp && ufw allow 443/tcp && ufw --force enable
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile && echo '/swapfile none swap sw 0 0' >> /etc/fstab || true
echo "Done. Next: git clone your repo into /opt/stebers-site, unpack the index into services/med-vqa-api/index, create deploy/.env, then cd deploy && docker compose up -d --build"
