const https = require('https');
const fs = require('fs');

// rotateCertsFromVault(vaultAddr, vaultToken, vaultPath, keyPath, certPath, caPath)
// returns a Promise that resolves {rotated: true, reloaded: bool}
function rotateCertsFromVault(vaultAddr, vaultToken, vaultPath, keyPath, certPath, caPath) {
    return new Promise((resolve, reject) => {
        if (!vaultAddr || !vaultToken || !vaultPath || !keyPath || !certPath || !caPath) {
            return reject(new Error('vault or cert paths not configured'));
        }

        const url = `${vaultAddr}/v1/${vaultPath}`;

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
                    const secret = parsed && parsed.data && parsed.data.data ? parsed.data.data : (parsed.data || parsed);
                    const serverKey = secret.server_key || secret.key || secret.private_key;
                    const serverCert = secret.server_cert || secret.cert;
                    const caCert = secret.ca_cert || secret.ca;
                    if (!serverKey || !serverCert || !caCert) return reject(new Error('vault response missing keys'));

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

                    // Attempt to reload TLS context if available
                    if (global.reloadServerCerts && typeof global.reloadServerCerts === 'function') {
                        const ok = global.reloadServerCerts();
                        return resolve({ rotated: true, reloaded: ok });
                    }
                    return resolve({ rotated: true, reloaded: false });
                } catch (e) {
                    return reject(e);
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.end();
    });
}

module.exports = { rotateCertsFromVault };
