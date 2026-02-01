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

// Auto execution config
const AUTO_ALLOWED_ACTIONS = (process.env.AUTO_ALLOWED_ACTIONS || 'restart_service,fetch_logs').split(',').map(s => s.trim()).filter(Boolean);
const AUTO_CIRCUIT_MAX = Number(process.env.AUTO_CIRCUIT_MAX || 3);
const AUTO_CIRCUIT_WINDOW = Number(process.env.AUTO_CIRCUIT_WINDOW || 600) * 1000; // ms
const AUTO_ALLOW_HMAC = process.env.AUTO_ALLOW_HMAC === 'true';

// Simple in-memory circuit breaker for auto actions: { action -> { count, windowStart } }
const autoStats = new Map();

function checkCircuit(action) {
    const now = Date.now();
    const st = autoStats.get(action);
    if (!st) return false;
    if (now - st.windowStart > AUTO_CIRCUIT_WINDOW) {
        // window expired
        autoStats.delete(action);
        return false;
    }
    return st.count >= AUTO_CIRCUIT_MAX;
}

function recordCircuit(action) {
    const now = Date.now();
    const st = autoStats.get(action);
    if (!st || (now - st.windowStart > AUTO_CIRCUIT_WINDOW)) {
        autoStats.set(action, { count: 1, windowStart: now });
    } else {
        st.count += 1;
        autoStats.set(action, st);
    }
}

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
        const a = Buffer.from(sig, 'hex');
        const b = Buffer.from(h, 'hex');
        if (a.length !== b.length) return false;
        return crypto.timingSafeEqual(a, b);
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

function parseCommandText(text) {
    if (!text || typeof text !== 'string') return null;
    const s = text.trim().toLowerCase();
    // Restart patterns
    const restartMatch = s.match(/restart(?:\s+server|\s+service)?(?:\s+([a-zA-Z0-9._\-]+))?/);
    if (restartMatch) {
        const svc = restartMatch[1] || 'app';
        return { action: 'restart_service', params: { args: [svc] } };
    }
    // Fetch logs
    if (/fetch\s+log(s)?|show\s+log(s)?|get\s+log(s)?/.test(s)) {
        return { action: 'fetch_logs', params: { args: [] } };
    }
    return null;
}

function isAutoAllowed(req, raw, signature) {
    // mTLS preferred
    const socket = req.socket || req.connection;
    if (socket && socket.authorized) {
        if (MTLS_CLIENT_CN_ALLOWLIST.length === 0) return true;
        const peer = socket.getPeerCertificate && socket.getPeerCertificate();
        const cn = peer && peer.subject && peer.subject.CN;
        return !!(cn && MTLS_CLIENT_CN_ALLOWLIST.includes(cn));
    }
    // fallback to HMAC if explicitly enabled
    if (AUTO_ALLOW_HMAC) return verifySignature(raw, signature);
    return false;
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

const { rotateCertsFromVault: rotateCertsFromVaultImpl } = require('../lib/rotator');

// Pull certs from Vault KV v2 and write to configured paths, then reload TLS context (wrapper)
function rotateCertsFromVault(cb) {
    const vaultAddr = process.env.VAULT_ADDR;
    const vaultToken = process.env.VAULT_TOKEN;
    const vaultPath = process.env.VAULT_CERT_PATH; // expect KV v2 path like 'secret/data/certs/server'
    const keyPath = process.env.MTLS_SERVER_KEY_PATH;
    const certPath = process.env.MTLS_SERVER_CERT_PATH;
    const caPath = process.env.MTLS_CA_PATH;

    rotateCertsFromVaultImpl(vaultAddr, vaultToken, vaultPath, keyPath, certPath, caPath)
        .then((res) => cb(null, res))
        .catch((err) => cb(err));
}

// POST /handshake
// body: { id, nonce, timestamp, action, params, auto_execute }
async function handshakeHandler(req, res) {
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
                return res.status(200).json({ status: 'suggested', suggestion });
            }

            // Auto-execute: pull certs from Vault and write to configured paths
            auditEvent({ ...audit, stage: 'executing' });
            rotateCertsFromVault((err, resObj) => {
                auditEvent({ ...audit, stage: 'finished', error: err ? err.message : null, result: resObj });
                if (err) return res.status(500).json({ error: err.message });
                return res.status(200).json({ status: 'ok', result: resObj });
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
            return res.status(200).json({ status: 'suggested', suggestion });
        }

        // Auto execute
        auditEvent({ ...audit, stage: 'executing' });
        runScriptSafe(action, params, (err, out) => {
            auditEvent({ ...audit, stage: 'finished', error: err ? err.message : null, output: out });
            if (err) return res.status(500).json({ error: err.message, output: out });
            return res.status(200).json({ status: 'ok', output: out });
        });

    } catch (e) {
        console.error('[management] error', e);
        return res.status(500).json({ error: e.message });
    }
}

router.post('/handshake', handshakeHandler);

// POST /command
// body: { id, nonce, timestamp, text, auto_execute }
async function commandHandler(req, res) {
    try {
        const raw = req.rawBody || JSON.stringify(req.body || {});
        const signature = req.get('x-signature');
        const { id, nonce, timestamp, text, auto_execute = false } = req.body || {};

        const parsed = parseCommandText(text);
        if (!parsed) return res.status(400).json({ error: 'unknown command' });

        if (!isReplayValid(nonce, timestamp)) return res.status(400).json({ error: 'invalid or replayed request' });

        const audit = { id, text, parsed, ts: new Date().toISOString(), origin: req.ip };
        auditEvent({ ...audit, stage: 'received' });

        const suggestion = { action: parsed.action, params: parsed.params };
        if (!auto_execute) {
            auditEvent({ ...audit, stage: 'suggested', suggestion });
            return res.status(200).json({ status: 'suggested', suggestion });
        }

        // Auto execution path
        if (!AUTO_ALLOWED_ACTIONS.includes(parsed.action)) return res.status(403).json({ error: 'action not allowed for auto-exec' });
        if (!isAutoAllowed(req, raw, signature)) return res.status(403).json({ error: 'not authorized for auto-exec' });
        if (checkCircuit(parsed.action)) return res.status(429).json({ error: 'auto-exec circuit open' });

        auditEvent({ ...audit, stage: 'executing' });
        recordCircuit(parsed.action);
        runScriptSafe(parsed.action, parsed.params, (err, out) => {
            auditEvent({ ...audit, stage: 'finished', error: err ? err.message : null, output: out });
            if (err) return res.status(500).json({ error: err.message, output: out });
            return res.status(200).json({ status: 'ok', output: out });
        });

    } catch (e) {
        console.error('[management] command error', e);
        return res.status(500).json({ error: e.message });
    }
}

router.post('/command', commandHandler);

module.exports = { router, handshakeHandler, commandHandler };
