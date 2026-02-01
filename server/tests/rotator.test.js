const fs = require('fs');
const path = require('path');
const https = require('https');
const { rotateCertsFromVault } = require('../lib/rotator');

jest.mock('https');

describe('rotator.rotateCertsFromVault', () => {
    const tmpDir = path.join(__dirname, '..', 'tmp_test');
    const keyPath = path.join(tmpDir, 'server.key');
    const certPath = path.join(tmpDir, 'server.crt');
    const caPath = path.join(tmpDir, 'ca.crt');

    beforeEach(() => {
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
        // ensure no global reload unless test sets it
        delete global.reloadServerCerts;
    });
    afterEach(() => {
        try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}
        jest.resetAllMocks();
    });

    test('writes certs from vault KV v2 shape and reloads', async () => {
        const fakeResp = JSON.stringify({ data: { data: { server_key: 'KEY', server_cert: 'CERT', ca_cert: 'CA' } } });

        // Mock https.request with a simple EventEmitter response
        const EventEmitter = require('events');
        const res = new EventEmitter();
        res.statusCode = 200;
        https.request.mockImplementation((url, opts, cb) => {
            // Call the response callback immediately and emit data/end shortly after
            process.nextTick(() => {
                cb(res);
                process.nextTick(() => {
                    res.emit('data', fakeResp);
                    res.emit('end');
                });
            });
            return { on: jest.fn(), end: () => {} };
        });

        // Provide a reload function
        global.reloadServerCerts = jest.fn(() => true);

        const resObj = await rotateCertsFromVault('https://vault', 'token', 'secret/data/certs/server', keyPath, certPath, caPath);
        expect(resObj.rotated).toBe(true);
        expect(resObj.reloaded).toBe(true);

        expect(fs.readFileSync(keyPath, 'utf8')).toBe('KEY');
        expect(fs.readFileSync(certPath, 'utf8')).toBe('CERT');
        expect(fs.readFileSync(caPath, 'utf8')).toBe('CA');
        expect(global.reloadServerCerts).toHaveBeenCalled();
    });

    test('rejects when vault response missing fields', async () => {
        const fakeResp = JSON.stringify({ data: { data: { server_key: 'KEY' } } });
        https.request.mockImplementation((url, opts, cb) => {
            const EventEmitter = require('events');
            const res = new EventEmitter();
            res.statusCode = 200;
            process.nextTick(() => { cb(res); process.nextTick(() => { res.emit('data', fakeResp); res.emit('end'); }); });
            return { on: jest.fn(), end: () => {} };
        });

        await expect(rotateCertsFromVault('https://vault', 'token', 'secret/data/certs/server', keyPath, certPath, caPath)).rejects.toThrow(/vault response missing/);
    });
});
