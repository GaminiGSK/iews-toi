#!/usr/bin/env bash
set -euo pipefail
LOG_PATH="${1:-/var/log/syslog}"
LINES="${2:-200}"
if [ -f "$LOG_PATH" ]; then
  echo "[management] Fetching last $LINES lines from $LOG_PATH"
  tail -n "$LINES" "$LOG_PATH"
else
  echo "[management] Log file $LOG_PATH not found"
  exit 2
fi
