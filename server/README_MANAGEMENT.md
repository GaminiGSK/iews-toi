# Management Handshake API (overview)

This folder contains a minimal, secure handshake endpoint for Antigravity agents to request server actions.

How it works
- Agent sends a signed POST to `/api/management/handshake` with JSON: { id, nonce, timestamp, action, params, auto_execute }
- Server validates HMAC-SHA256 signature using `AGENT_SHARED_SECRET` env var, checks timestamp and nonce (prevent replay), and verifies action is whitelisted.
- If `auto_execute` is false (default), server returns a `suggestion` object with the approved script and args. If `auto_execute` is true, the server will run the mapped script (from `server/scripts/`) and return output.

Security notes
- Always set `AGENT_SHARED_SECRET` in your environment and keep it secret.
- Use HTTPS in production and restrict network access to the management endpoint.
- Replace in-memory nonce store with Redis for multi-instance deployments.
- Limit `ALLOWED_ACTIONS` to a small set of safe scripts; avoid arbitrary shell execution.

Files added
- `routes/management.js` - the endpoint and verification logic
- `scripts/*.sh` and `scripts/*.ps1` - sample whitelisted scripts (for Linux/macOS and Windows)
- `tools/agent_client.py` - example agent client to compute HMAC and call the endpoint
- `logs/management.log` - (created on first audit) collects a JSON line per request

Environment
- AGENT_SHARED_SECRET=your_secret_value
- Ensure the server process user can run the operations (or use specific sudoers rules)

Next steps
1. Set `AGENT_SHARED_SECRET` in env or use a secret manager.
2. Review and customize `ALLOWED_ACTIONS` in `management.js`.
3. Add monitoring and IP allowlist or mTLS to protect the endpoint.
4. If you want, I can also add automatic registration (public key exchange) or replace HMAC with JWT/mTLS.

## mTLS (mutual TLS) support 🔐

This project supports optional mTLS for authenticating agents. To enable:

- Configure the server environment:
  - `MTLS_REQUIRED=true`
  - `MTLS_SERVER_KEY_PATH=/path/to/server.key`
  - `MTLS_SERVER_CERT_PATH=/path/to/server.crt`
  - `MTLS_CA_PATH=/path/to/ca.crt` (the CA that signs clients)
  - Optionally: `MTLS_CLIENT_CN_ALLOWLIST=agent-client,github-actions` to limit which client cert CNs are accepted

- Generate certs (dev example): `tools/mtls/generate_ca.sh` and `tools/mtls/generate_client.sh`.

- For CI (GitHub Actions), add secrets:
  - `MTLS_CLIENT_CERT` (PEM), `MTLS_CLIENT_KEY` (PEM), `MTLS_CA_CERT` (PEM). The included workflow writes these at runtime and uses them with `curl --cert --key --cacert`.

## Natural language commands

A convenience route is provided so your agent (or you) can POST plain text commands like `Restart server` to the server. Example:

POST /api/management/command
Body: { "id": "agent-1", "nonce": "n-123", "timestamp": 167xxxx, "text": "Restart server", "auto_execute": true }

Behavior:
- The text is parsed (simple rules) into an `action` (e.g., `restart_service`) and `params`.
- If `auto_execute: true` the server will attempt to auto-run the action **only** when the caller is authorized for auto-exec (mTLS client CN allowlist by default; `AUTO_ALLOW_HMAC=true` enables HMAC fallback).
- Circuit breaker prevents many auto restarts: set `AUTO_CIRCUIT_MAX` and `AUTO_CIRCUIT_WINDOW` to tune limits.

Config environment variables (defaults shown):
- `AUTO_ALLOWED_ACTIONS=restart_service,fetch_logs`
- `AUTO_CIRCUIT_MAX=3`
- `AUTO_CIRCUIT_WINDOW=600` (seconds)
- `AUTO_ALLOW_HMAC=false` (set to `true` only if you accept HMAC for auto-exec)

## Vault Integration & Automated Rotation 🔄

This project supports automatic certificate rotation where the server pulls updated certs from Vault (KV v2). To enable:

1. Configure Vault with a KV v2 secret at a path (example `secret/data/certs/server`) containing at least:
   - `server_key` (PEM private key)
   - `server_cert` (PEM certificate)
   - `ca_cert` (PEM CA chain)

2. Set these server environment variables:
   - `VAULT_ADDR` (http(s)://vault.example:8200)
   - `VAULT_TOKEN` (token with read access to the path)
   - `VAULT_CERT_PATH` (e.g., `secret/data/certs/server`)

3. Ensure MTLS paths are configured (`MTLS_SERVER_KEY_PATH`, `MTLS_SERVER_CERT_PATH`, `MTLS_CA_PATH`).

4. Trigger cert rotation:
   - Manually: POST to `/api/management/handshake` with `action: rotate_certs` and `auto_execute: true` (HMAC or mTLS auth required). Or run `tools/mtls/vault/pull_and_write.sh` on the server with env vars set.
   - Automatically: A scheduled GitHub Action `.github/workflows/rotate-certs.yml` is provided; configure `MANAGEMENT_ENDPOINT` and auth secrets in the repository and enable the workflow.

Notes
- The server writes certs atomically and attempts to reload the TLS context at runtime (`reloadServerCerts()`). If runtime reload isn't supported in your Node version/environment, a restart will be required.
- For production, use a proper PKI and rotate tokens and paths regularly. Ensure Vault tokens are stored securely (GitHub Secrets or a dedicated secret manager).

Notes
- When `MTLS_REQUIRED=true` the server enforces client certificate verification and skips HMAC verification.
- Use proper PKI for production; these helper scripts are for dev/staging use only.


## GitOps / CI Integration (GitHub Actions) 🔁

You can wire merges to `main` into an automated deploy flow that triggers the management endpoint:

- Add two GitHub repository secrets:
  - `MANAGEMENT_ENDPOINT` -> e.g. `https://your.example.com/api/management/handshake`
  - `AGENT_SHARED_SECRET` -> the same value you set in the server env `AGENT_SHARED_SECRET`

- A workflow file `.github/workflows/gitops-deploy.yml` is included. On push to `main` it will:
  1. Run install/test/build steps (customize for your project)
  2. Construct a signed payload and POST to the management endpoint to trigger `action: deploy` with `auto_execute: true`.

- Local helper: `tools/github_deploy.sh` helps you trigger the same signed call from a dev machine (requires `MANAGEMENT_ENDPOINT` and `AGENT_SHARED_SECRET` env vars).

Security notes
- Use separate deploy secret (rotate it regularly). Prefer storing secrets in a dedicated secret manager. Consider using mTLS instead if you need stronger identity guarantees.
- Keep `auto_execute` enabled only after you validate the workflow in a staging environment.

