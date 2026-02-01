const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

let handshakeHandler;

function makeReq(options) {
    const raw = JSON.stringify(options.body || {});
    return {
        rawBody: raw,
        body: options.body || {},
        ip: options.ip || '127.0.0.1',
        socket: options.socket || {},
        get: (h) => options.headers && options.headers[h.toLowerCase()],
    };
}

function makeRes() {
    const out = {};
    out.status = (code) => { out.statusCode = code; return out; };
    out.json = (obj) => { out.body = obj; return out; };
    return out;
}

describe('management handshake handler', () => {
    const tmpDir = path.join(__dirname, '..', 'tmp_test_route');
    const keyPath = path.join(tmpDir, 'server.key');
    const certPath = path.join(tmpDir, 'server.crt');
    const caPath = path.join(tmpDir, 'ca.crt');

    beforeEach(() => {
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
        process.env.AGENT_SHARED_SECRET = 'testsecret';
        process.env.VAULT_ADDR = 'https://vault';
        process.env.VAULT_TOKEN = 'token';
        process.env.VAULT_CERT_PATH = 'secret/data/certs/server';
        process.env.MTLS_SERVER_KEY_PATH = keyPath;
        process.env.MTLS_SERVER_CERT_PATH = certPath;
        process.env.MTLS_CA_PATH = caPath;

        // mock rotateCertsFromVault implementation to avoid network
        jest.resetModules();
        const rotator = require('../lib/rotator');
        rotator.rotateCertsFromVault = jest.fn(() => Promise.resolve({ rotated: true, reloaded: true }));
        // ensure global loader present
        global.reloadServerCerts = jest.fn(() => true);

        // require the management route after setting env vars so it picks up SHARED_SECRET
        const mgmt = require('../routes/management');
        handshakeHandler = mgmt.handshakeHandler;
    });

    afterEach(() => {
        try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}
        delete process.env.AGENT_SHARED_SECRET;
    });

    test('rejects without valid HMAC when mTLS not required', async () => {
        delete process.env.MTLS_REQUIRED;
        const req = makeReq({ body: { id: 'a', nonce: 'n1', timestamp: Math.floor(Date.now()/1000), action: 'rotate_certs', params: {}, auto_execute: true } });
        const res = makeRes();
        await handshakeHandler(req, res);
        expect(res.statusCode).toBe(403);
    });

    test('accepts rotate_certs with valid signature', async () => {
        delete process.env.MTLS_REQUIRED;
        const payload = { id: 'a', nonce: 'n2', timestamp: Math.floor(Date.now()/1000), action: 'rotate_certs', params: {}, auto_execute: true };
        const raw = JSON.stringify(payload);
        const h = crypto.createHmac('sha256', process.env.AGENT_SHARED_SECRET).update(raw).digest('hex');
        const req = makeReq({ body: payload, headers: { 'x-signature': 'sha256=' + h } });
        const res = makeRes();
        await handshakeHandler(req, res);
        expect(res.body.status).toBe('ok');
        expect(res.body.result).toHaveProperty('rotated', true);
    });

    test('suggestion mode returns suggestion when auto_execute false', async () => {
        delete process.env.MTLS_REQUIRED;
        const payload = { id: 'a', nonce: 'n3', timestamp: Math.floor(Date.now()/1000), action: 'restart_service', params: { args: ['app'] }, auto_execute: false };
        const raw = JSON.stringify(payload);
        const h = crypto.createHmac('sha256', process.env.AGENT_SHARED_SECRET).update(raw).digest('hex');
        const req = makeReq({ body: payload, headers: { 'x-signature': 'sha256=' + h } });
        const res = makeRes();
        await handshakeHandler(req, res);
        expect(res.statusCode).toBe(200); // suggestion responses are explicit 200
        expect(res.body.status).toBe('suggested');
        expect(res.body.suggestion).toHaveProperty('script');
    });
});
