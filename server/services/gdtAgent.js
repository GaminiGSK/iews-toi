/**
 * GDT Agent Service — Lightweight HTTP-based automation (NO browser required)
 *
 * Uses axios + cookie-jar to simulate login form submission.
 * RAM usage: ~5MB (vs 400-800MB for Puppeteer) — works on 512MB Cloud Run.
 *
 * Flow:
 *   1. launchAndLogin(username, password)
 *      → GET login page (grab cookies/CSRF)
 *      → POST credentials → GDT sends OTP to user's phone
 *      → Returns { sessionId, status: 'otp_sent' }
 *
 *   2. submitOtp(sessionId, otp)
 *      → POST OTP to complete login
 *      → Returns { status: 'logged_in' }
 */

const axios  = require('axios');
const https  = require('https');

// In-memory session store
const sessions = new Map();

const GDT_BASE   = 'https://owp.tax.gov.kh';
const LOGIN_URL  = `${GDT_BASE}/gdtowpcoreweb/login`;
const LOGIN_POST = `${GDT_BASE}/gdtowpcoreweb/login/authen`;
const OTP_URL    = `${GDT_BASE}/gdtowpcoreweb/login/verifyOTP`;

function makeSessionId() {
    return `gdt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Parse Set-Cookie headers into a cookie string
 */
function parseCookies(setCookieHeaders) {
    if (!setCookieHeaders) return '';
    const arr = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
    return arr.map(c => c.split(';')[0]).join('; ');
}

/**
 * Extract a hidden input value from HTML (e.g. CSRF token, _token, __RequestVerificationToken)
 */
function extractHidden(html, names) {
    for (const name of names) {
        // Try <input type="hidden" name="X" value="Y">
        const re = new RegExp(`<input[^>]+name=["']${name}["'][^>]+value=["']([^"']+)["']`, 'i');
        let m = html.match(re);
        if (m) return m[1];
        // Try reversed attribute order: value first then name
        const re2 = new RegExp(`<input[^>]+value=["']([^"']+)["'][^>]+name=["']${name}["']`, 'i');
        m = html.match(re2);
        if (m) return m[1];
    }
    return null;
}

/**
 * Build axios instance with shared config
 */
function makeClient(cookies = '') {
    return axios.create({
        baseURL: GDT_BASE,
        timeout: 30000,
        maxRedirects: 5,
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        headers: {
            'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9,km;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection':      'keep-alive',
            ...(cookies ? { 'Cookie': cookies } : {}),
        },
        validateStatus: () => true // don't throw on 3xx/4xx
    });
}

/**
 * Step 1: GET login page, extract cookies + CSRF, POST credentials
 */
async function launchAndLogin(username, password) {
    const sessionId = makeSessionId();
    console.log(`[GDT HTTP] Starting login for: ${username}`);

    // ── Step 1: GET login page to collect session cookies ────────────────────
    const client1 = makeClient();
    const getResp = await client1.get(LOGIN_URL);
    const rawCookies = parseCookies(getResp.headers['set-cookie']);
    const html = typeof getResp.data === 'string' ? getResp.data : '';

    console.log(`[GDT HTTP] GET login page → HTTP ${getResp.status} | Cookies: ${rawCookies.substring(0, 80)}`);

    // Extract CSRF / verification token (common names on GDT portal)
    const csrfToken = extractHidden(html, [
        '__RequestVerificationToken', '_token', 'csrf_token',
        'antiforgery_token', '_csrf', 'CSRFToken'
    ]);
    console.log(`[GDT HTTP] CSRF token: ${csrfToken ? csrfToken.substring(0, 20) + '...' : 'none found'}`);

    // ── Step 2: POST credentials ─────────────────────────────────────────────
    // Build form data — try common GDT field names
    const formData = new URLSearchParams();
    formData.append('username',  username);
    formData.append('password',  password);
    formData.append('UserName',  username);
    formData.append('Password',  password);
    formData.append('loginType', 'TID');  // GDT portal has TID/TIN login type
    if (csrfToken) {
        formData.append('__RequestVerificationToken', csrfToken);
        formData.append('_token', csrfToken);
    }

    const client2 = makeClient(rawCookies);
    const postResp = await client2.post(LOGIN_POST, formData.toString(), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Referer': LOGIN_URL,
            'Origin':  GDT_BASE,
        }
    });

    const postCookies = parseCookies(postResp.headers['set-cookie']) || rawCookies;
    const postHtml    = typeof postResp.data === 'string' ? postResp.data : '';
    const redirectUrl = postResp.headers['location'] || postResp.request?.res?.responseUrl || LOGIN_POST;

    console.log(`[GDT HTTP] POST credentials → HTTP ${postResp.status} | Redirect: ${redirectUrl}`);

    // Check for error messages in response HTML
    const errorMatch = postHtml.match(/class=["'].*?error.*?["'][^>]*>([^<]+)/i)
                    || postHtml.match(/alert-danger[^>]*>.*?<[^>]+>([^<]+)/i);
    if (errorMatch && postResp.status < 300) {
        const errMsg = errorMatch[1]?.trim();
        if (errMsg && errMsg.length < 200) {
            console.warn(`[GDT HTTP] Login error message on page: "${errMsg}"`);
        }
    }

    // If we got a redirect to OTP or dashboard — success path
    const sessionCookies = postCookies || rawCookies;

    // Store full session state
    sessions.set(sessionId, {
        cookies:     sessionCookies,
        username,
        status:      'otp_pending',
        createdAt:   Date.now(),
        postStatus:  postResp.status,
        redirectUrl,
    });

    // Auto-cleanup after 10 minutes
    setTimeout(() => sessions.delete(sessionId), 10 * 60 * 1000);

    const success = postResp.status === 302 || postResp.status === 200;
    const info = `HTTP_LOGIN=${postResp.status} | Redirect=${redirectUrl.substring(0, 60)}`;

    return {
        sessionId,
        status:      'otp_sent',
        httpStatus:  postResp.status,
        message:     success
            ? 'Credentials sent to GDT. OTP should be dispatched to your registered phone/email.'
            : `GDT returned HTTP ${postResp.status} — check credentials`,
        info,
    };
}

/**
 * Step 2: POST OTP to complete GDT login
 */
async function submitOtp(sessionId, otp) {
    const session = sessions.get(sessionId);
    if (!session) throw new Error('Session expired or not found. Please launch again.');

    console.log(`[GDT HTTP] Submitting OTP: ${otp} for session: ${sessionId}`);

    const formData = new URLSearchParams();
    formData.append('otp',   otp);
    formData.append('OTP',   otp);
    formData.append('code',  otp);
    formData.append('Code',  otp);
    formData.append('verificationCode', otp);

    const client = makeClient(session.cookies);
    const resp = await client.post(OTP_URL, formData.toString(), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Referer': LOGIN_POST,
            'Origin':  GDT_BASE,
        }
    });

    const newCookies = parseCookies(resp.headers['set-cookie']) || session.cookies;
    session.cookies  = newCookies;
    session.status   = 'logged_in';

    console.log(`[GDT HTTP] OTP submit → HTTP ${resp.status}`);

    return {
        status:     'otp_submitted',
        httpStatus: resp.status,
        message:    resp.status < 400 ? 'OTP accepted — GDT login complete.' : `OTP response: HTTP ${resp.status}`,
        redirectUrl: resp.headers['location'] || OTP_URL,
    };
}

/**
 * Close/remove a session
 */
function closeSession(sessionId) {
    sessions.delete(sessionId);
}

module.exports = { launchAndLogin, submitOtp, closeSession };
