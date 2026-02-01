const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const SHARED_SECRET = process.env.AGENT_SHARED_SECRET || '';
const NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const TIMESTAMP_TOLERANCE_S = 300; // 5 minutes
// mTLS config
const MTLS_REQUIRED = process.env.MTLS_REQUIRED === 'true';
// Comma separated list of allowed client cert CNs (optional). If empty, any client cert signed by CA is accepted.
const MTLS_CLIENT_CN_ALLOWLIST = (process.env.MTLS_CLIENT_CN_ALLOWLIST || '').split(',').map(s => s.trim()).filter(Boolean);

// Whitelisted actions -> scripts (supports Windows PowerShell variants)
const ALLOWED_ACTIONS = {
    restart_service: {
        script: path.resolve(__dirname, '..', 'scripts', 'restart-service.sh'),
        scriptWin: path.resolve(__dirname, '..', 'scripts', 'restart-service.ps1')
    },
    deploy: {
        script: path.resolve(__dirname, '..', 'scripts', 'deploy.sh'),
        scriptWin: path.resolve(__dirname, '..', 'scripts', 'deploy.ps1')
    },
    fetch_logs: {
        script: path.resolve(__dirname, '..', 'scripts', 'fetch-logs.sh'),
        scriptWin: path.resolve(__dirname, '..', 'scripts', 'fetch-logs.ps1')
    }
};

// Simple in-memory nonce store - replace with Redis for production
const nonces = new Map();

function pruneNonces() {
    const now = Date.now();
    for (const [k, t] of nonces.entries()) {
        if (now - t > NONCE_TTL_MS) nonces.delete(k);
    }
}

function verifySignature(rawBody, signature) {
    if (!SHARED_SECRET) return false;
    if (!signature) return false;
    // allow header formats like 'sha256=abcd' or bare hex
    const sig = signature.startsWith('sha256=') ? signature.split('=')[1] : signature;
    const h = crypto.createHmac('sha256', SHARED_SECRET).update(rawBody).digest('hex');
    try {
        return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(h));
    } catch (e) {
        return false;
    }
}

function verifyAuth(req, rawBody, signature) {
    // If mTLS is required, validate the client certificate first
    if (MTLS_REQUIRED) {
        const socket = req.socket || req.connection;
        if (!socket || !socket.authorized) return false;
        if (MTLS_CLIENT_CN_ALLOWLIST.length > 0) {
            const peer = socket.getPeerCertificate && socket.getPeerCertificate();
            const cn = peer && peer.subject && peer.subject.CN;
            if (!cn || !MTLS_CLIENT_CN_ALLOWLIST.includes(cn)) return false;
        }
        return true;
    }
    // Fallback to HMAC signature verification
    return verifySignature(rawBody, signature);
}

function isReplayValid(nonce, timestamp) {
    pruneNonces();
    if (!nonce || !timestamp) return false;
    const ts = Number(timestamp);
    if (Number.isNaN(ts)) return false;
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - ts) > TIMESTAMP_TOLERANCE_S) return false;
    if (nonces.has(nonce)) return false; // replay
    nonces.set(nonce, Date.now());
    return true;
}

function auditEvent(entry) {
    try {
        const logDir = path.resolve(__dirname, '..', 'logs');
        if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
        const file = path.join(logDir, 'management.log');
        fs.appendFileSync(file, JSON.stringify(entry) + '\n');
    } catch (e) {
        console.error('[management] audit failed', e);
    }
}

function runScriptSafe(action, params = {}, cb) {
    const actionDef = ALLOWED_ACTIONS[action];
    if (!actionDef) return cb(new Error('action not allowed'));

    const isWindows = process.platform === 'win32';
    const script = isWindows ? (actionDef.scriptWin || actionDef.script) : actionDef.script;
    // allow safe chars including Windows path separators and @ for email/refs
    const safeArgRegex = /^[a-zA-Z0-9._\-\\/\:@]+$/;
    const args = [];
    if (params.args && Array.isArray(params.args)) {
        for (const a of params.args) {
            if (typeof a === 'string' && safeArgRegex.test(a)) args.push(a);
        }
    }

    const opts = { timeout: 60 * 1000 }; // 60s timeout

    if (isWindows) {
        // Run PowerShell script with bypass policy
        const psArgs = ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', script, ...args];
        execFile('powershell.exe', psArgs, opts, (err, stdout, stderr) => {
            cb(err, { stdout: stdout ? stdout.toString() : '', stderr: stderr ? stderr.toString() : '' });
        });
    } else {
        execFile(script, args, opts, (err, stdout, stderr) => {
            cb(err, { stdout: stdout ? stdout.toString() : '', stderr: stderr ? stderr.toString() : '' });
        });
    }
}

// Pull certs from Vault KV v2 and write to configured paths, then reload TLS context
function rotateCertsFromVault(cb) {
    const vaultAddr = process.env.VAULT_ADDR;
    const vaultToken = process.env.VAULT_TOKEN;
    const vaultPath = process.env.VAULT_CERT_PATH; // expect KV v2 path like 'secret/data/certs/server'
    const keyPath = process.env.MTLS_SERVER_KEY_PATH;
    const certPath = process.env.MTLS_SERVER_CERT_PATH;
    const caPath = process.env.MTLS_CA_PATH;

    if (!vaultAddr || !vaultToken || !vaultPath || !keyPath || !certPath || !caPath) {
        return cb(new Error('vault or cert paths not configured'));
    }

    const url = `${vaultAddr}/v1/${vaultPath}`;
    const https = require('https');

    const opts = {
        method: 'GET',
        headers: {
            'X-Vault-Token': vaultToken,
            'Accept': 'application/json'
        }
    };

    const req = https.request(url, opts, (res) => {
        let body = '';
        res.on('data', (d) => body += d);
        res.on('end', () => {
            try {
                const parsed = JSON.parse(body);
                // Support KV v2 shape: { data: { data: { key: '...', cert: '...', ca: '...' } } }
                const secret = parsed && parsed.data && parsed.data.data ? parsed.data.data : (parsed.data || parsed);
                const serverKey = secret.server_key || secret.key || secret.private_key;
                const serverCert = secret.server_cert || secret.cert;
                const caCert = secret.ca_cert || secret.ca;
                if (!serverKey || !serverCert || !caCert) return cb(new Error('vault response missing keys'));

                // Write files atomically
                const tmpK = keyPath + '.tmp';
                const tmpC = certPath + '.tmp';
                const tmpCA = caPath + '.tmp';
                fs.writeFileSync(tmpK, serverKey, { mode: 0o600 });
                fs.writeFileSync(tmpC, serverCert, { mode: 0o644 });
                fs.writeFileSync(tmpCA, caCert, { mode: 0o644 });
                fs.renameSync(tmpK, keyPath);
                fs.renameSync(tmpC, certPath);
                fs.renameSync(tmpCA, caPath);

                // Reload TLS context if available
                if (global.reloadServerCerts && typeof global.reloadServerCerts === 'function') {
                    const ok = global.reloadServerCerts();
                    return cb(null, { rotated: true, reloaded: ok });
                }
                return cb(null, { rotated: true, reloaded: false });
            } catch (e) {
                return cb(e);
            }
        });
    });

    req.on('error', (e) => cb(e));
    req.end();
}

// POST /handshake
// body: { id, nonce, timestamp, action, params, auto_execute }
router.post('/handshake', async (req, res) => {
    try {
        const raw = req.rawBody || JSON.stringify(req.body || {});
        const signature = req.get('x-signature');

        if (!verifyAuth(req, raw, signature)) return res.status(403).json({ error: 'invalid auth' });

        const { id, nonce, timestamp, action, params = {}, auto_execute = false } = req.body || {};
        if (!isReplayValid(nonce, timestamp)) return res.status(400).json({ error: 'invalid or replayed request' });
        // Allow a special internal action 'rotate_certs' even though it's not a script
        if (action !== 'rotate_certs' && !action || (action !== 'rotate_certs' && !ALLOWED_ACTIONS[action])) return res.status(403).json({ error: 'action not allowed' });

        // include client cert summary if present
        const peer = req.socket && req.socket.getPeerCertificate ? req.socket.getPeerCertificate() : null;
        const clientCertInfo = peer && Object.keys(peer || {}).length ? { subject: peer.subject, fingerprint: peer.fingerprint } : undefined;

        const audit = { id, action, params, ts: new Date().toISOString(), origin: req.ip, client: clientCertInfo };
        auditEvent({ ...audit, stage: 'received' });

        // Special case: certificate rotation via Vault (server pulls from Vault)
        if (action === 'rotate_certs') {
            // Suggestion: show which Vault path will be used (no secrets returned)
            const suggestion = { method: 'vault_pull', vault_path: process.env.VAULT_CERT_PATH || '<not-configured>' };
            if (!auto_execute) {
                auditEvent({ ...audit, stage: 'suggested', suggestion });
                return res.json({ status: 'suggested', suggestion });
            }

            // Auto-execute: pull certs from Vault and write to configured paths
            auditEvent({ ...audit, stage: 'executing' });
            rotateCertsFromVault((err, resObj) => {
                auditEvent({ ...audit, stage: 'finished', error: err ? err.message : null, result: resObj });
                if (err) return res.status(500).json({ error: err.message });
                return res.json({ status: 'ok', result: resObj });
            });
            return;
        }

        const suggestion = {
            platform: process.platform,
            script: process.platform === 'win32' ? (ALLOWED_ACTIONS[action].scriptWin || ALLOWED_ACTIONS[action].script) : ALLOWED_ACTIONS[action].script,
            args: params.args || []
        };

        if (!auto_execute) {
            auditEvent({ ...audit, stage: 'suggested', suggestion });
            return res.json({ status: 'suggested', suggestion });
        }

        // Auto execute
        auditEvent({ ...audit, stage: 'executing' });
        runScriptSafe(action, params, (err, out) => {
            auditEvent({ ...audit, stage: 'finished', error: err ? err.message : null, output: out });
            if (err) return res.status(500).json({ error: err.message, output: out });
            return res.json({ status: 'ok', output: out });
        });

    } catch (e) {
        console.error('[management] error', e);
        return res.status(500).json({ error: e.message });
    }
});

module.exports = router;
