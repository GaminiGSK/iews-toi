#!/usr/bin/env bash
set -euo pipefail
BRANCH="${1:-main}"
echo "[management] Deploy requested for branch ${BRANCH}"
# Example deploy flow - adapt to your infra
cd "$(dirname "$0")/.." || exit 1
# Pull, install, build, restart
git fetch origin && git checkout "$BRANCH" && git pull origin "$BRANCH"
if [ -f package.json ]; then
  npm ci
  npm run build || true
fi
# Restart service (assume pm2 or systemd)
if command -v pm2 >/dev/null 2>&1; then
  pm2 restart all || true
else
  sudo systemctl restart app || true
fi
