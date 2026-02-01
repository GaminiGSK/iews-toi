let commandHandler;

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

describe('command handler', () => {
    beforeEach(() => {
        jest.resetModules();
        process.env.AUTO_ALLOWED_ACTIONS = 'restart_service,fetch_logs';
        process.env.AUTO_CIRCUIT_MAX = '3';
        process.env.AUTO_CIRCUIT_WINDOW = '600';
        delete process.env.AUTO_ALLOW_HMAC;
        // require the management module after setting envs so it picks up settings
        const mgmt = require('../routes/management');
        commandHandler = mgmt.commandHandler;
    });

    test('unknown text returns 400', async () => {
        const req = makeReq({ body: { id: '1', nonce: 'n1', timestamp: Math.floor(Date.now()/1000), text: 'do something weird' } });
        const res = makeRes();
        await commandHandler(req, res);
        expect(res.statusCode).toBe(400);
    });

    test('rejects auto-exec when not authorized (mTLS required set)', async () => {
        process.env.MTLS_REQUIRED = 'true';
        process.env.MTLS_CLIENT_CN_ALLOWLIST = 'agent';
        // re-require module so config is picked up
        const mgmt = require('../routes/management');
        commandHandler = mgmt.commandHandler;
        const req = makeReq({ body: { id: '1', nonce: 'n2', timestamp: Math.floor(Date.now()/1000), text: 'Restart server', auto_execute: true }, headers: {} });
        const res = makeRes();
        await commandHandler(req, res);
        expect(res.statusCode).toBe(403);
    });

    test('allows auto-exec for authorized client via HMAC fallback', async () => {
        process.env.AUTO_ALLOW_HMAC = 'true';
        process.env.AGENT_SHARED_SECRET = 'testsecret';
        // re-require module so config is picked up
        const mgmt = require('../routes/management');
        commandHandler = mgmt.commandHandler;
        const body = { id: '1', nonce: 'n3', timestamp: Math.floor(Date.now()/1000), text: 'Restart server', auto_execute: true };
        const raw = JSON.stringify(body);
        const crypto = require('crypto');
        const h = crypto.createHmac('sha256', process.env.AGENT_SHARED_SECRET).update(raw).digest('hex');
        const req = makeReq({ body, headers: { 'x-signature': 'sha256=' + h } });
        const res = makeRes();
        // mock execFile to complete immediately
        const cp = require('child_process');
        cp.execFile = jest.fn((s,a,o,cb) => { cb(null, 'stdout', ''); });
        await commandHandler(req, res);
        expect(res.statusCode).toBe(200);
    });

    test('circuit breaker prevents too many restarts', async () => {
        process.env.MTLS_REQUIRED = 'true';
        process.env.MTLS_CLIENT_CN_ALLOWLIST = 'agent-client';
        const socket = { authorized: true, getPeerCertificate: () => ({ subject: { CN: 'agent-client' } }) };
        // trigger AUTO_CIRCUIT_MAX times
        // re-require module so config is picked up
        const mgmt = require('../routes/management');
        commandHandler = mgmt.commandHandler;
        for (let i=0;i<Number(process.env.AUTO_CIRCUIT_MAX);i++) {
            const req = makeReq({ body: { id: '1', nonce: 'n' + i, timestamp: Math.floor(Date.now()/1000), text: 'Restart server', auto_execute: true }, socket });
            const res = makeRes();
            // mock execFile to avoid failures
            const cp = require('child_process'); cp.execFile = jest.fn((s,a,o,cb) => { cb(null, 'stdout', '') });
            await commandHandler(req, res);
        }
        // next one should be rejected with 429
        const req2 = makeReq({ body: { id: '1', nonce: 'n-x', timestamp: Math.floor(Date.now()/1000), text: 'Restart server', auto_execute: true }, socket });
        const res2 = makeRes();
        await commandHandler(req2, res2);
        expect(res2.statusCode).toBe(429);
    });
});