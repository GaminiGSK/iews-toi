#!/usr/bin/env bash
set -euo pipefail
SERVICE_NAME="${1:-app}"
echo "[management] Restart requested for ${SERVICE_NAME}"
if command -v systemctl >/dev/null 2>&1; then
  sudo systemctl restart "${SERVICE_NAME}"
  sudo systemctl status "${SERVICE_NAME}" --no-pager
else
  echo "systemctl not found; trying pm2"
  pm2 restart "${SERVICE_NAME}" || echo "pm2 restart failed"
fi
