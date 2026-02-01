#!/usr/bin/env bash
set -euo pipefail

if [ -z "${MANAGEMENT_ENDPOINT:-}" ] || [ -z "${AGENT_SHARED_SECRET:-}" ]; then
  echo "Please set MANAGEMENT_ENDPOINT and AGENT_SHARED_SECRET environment variables"
  exit 2
fi

NONCE="local-$(date +%s)-$RANDOM"
TIMESTAMP=$(date +%s)
PAYLOAD=$(python - <<PY
import json, time
payload={"id":"local-deploy","nonce":"%s","timestamp":%d,"action":"deploy","params":{"args":["main"]},"auto_execute":True}
print(json.dumps(payload, separators=(',',':')))
PY
"$NONCE" "$TIMESTAMP")

SIG=$(python - <<PY
import os, hmac, hashlib
secret=os.environ['AGENT_SHARED_SECRET']
payload=os.environ['PAYLOAD']
print('sha256='+hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest())
PY
)

echo "Payload: $PAYLOAD"

curl -v -sS -X POST "$MANAGEMENT_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "x-signature: $SIG" \
  -d "$PAYLOAD"

