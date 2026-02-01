"""Simple Antigravity agent client example to call /api/management/handshake"""
import hmac
import hashlib
import json
import time
import requests

SHARED_SECRET = "replace_with_secret"
URL = "http://localhost:5000/api/management/handshake"

payload = {
    "id": "agent-1",
    "nonce": "nonce-12345",
    "timestamp": int(time.time()),
    "action": "restart_service",
    "params": {"args": ["app"]},
    "auto_execute": True
}
raw = json.dumps(payload, separators=(',', ':'))
sig = hmac.new(SHARED_SECRET.encode(), raw.encode(), hashlib.sha256).hexdigest()
headers = {"Content-Type": "application/json", "x-signature": f"sha256={sig}"}

r = requests.post(URL, data=raw, headers=headers)
print(r.status_code)
print(r.text)
