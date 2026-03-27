/**
 * GDT Agent Service 鈥?Puppeteer-based headless automation
 *
 * Flow:
 *   1. launchAndLogin(username, password)  鈫?fills TIN/pass, clicks Send Code
 *   2. submitOtp(sessionId, otp)           鈫?enters OTP, completes login
 *   3. Session is kept alive in memory for OTP step
 *
 * Fix (27-Mar-2026): Removed hard dependency on `ul.nav-tabs li` selector.
 * Now uses domcontentloaded (faster), 3-strategy TID tab detection, and
 * captures diagnostic screenshots so errors are always visible to the user.
 */

const puppeteer = require('puppeteer-core');

const GDT_URL   = 'https://owp.tax.gov.kh/gdtowpcoreweb/login';
const EXEC_PATH = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium';

// In-memory session store { sessionId: { browser, page, status } }
const sessions = new Map();

const wait = (ms) => new Promise(r => setTimeout(r, ms));

function makeSessionId() {
    return `gdt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Try a list of CSS selectors, returns { el, sel } for the first match found
 */
async function trySelectors(page, selectors, timeout = 4000) {
    for (const sel of selectors) {
        try {
            const el = await page.waitForSelector(sel, { timeout });
            if (el) return { el, sel };
        } catch { /* continue */ }
    }
    return null;
}

/**
 * Step 1: Open GDT portal, find TID tab, fill credentials, click Send Code
 * Returns { sessionId, status:'otp_sent', screenshot, diagShot }
 */
async function launchAndLogin(username, password) {
    const sessionId = makeSessionId();

    const browser = await puppeteer.launch({
        executablePath: EXEC_PATH,
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-extensions',
            '--disable-background-networking',
        ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    );

    try {
        console.log(`[GDT Agent] Navigating to ${GDT_URL}`);

        // domcontentloaded is faster than networkidle2 鈥?avoids 15-30s wait
        await page.goto(GDT_URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
        await wait(2500); // allow JS to render tabs

        // 鈹€鈹€ DIAGNOSTIC SCREENSHOT 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
        const diagShot  = await page.screenshot({ encoding: 'base64', type: 'png' });
        const diagUrl   = page.url();
        const diagTitle = await page.title().catch(() => '');
        console.log(`[GDT Agent] Page loaded 鈫?${diagUrl} | Title: "${diagTitle}"`);

        // 鈹€鈹€ STRATEGY A: original ul.nav-tabs selector (softer 8s timeout) 鈹€鈹€鈹€
        let tidClicked = false;
        try {
            await page.waitForSelector('ul.nav-tabs li', { timeout: 8000 });
            const tabs = await page.$$('ul.nav-tabs li a');
            for (const tab of tabs) {
                const txt = await page.evaluate(el => el.textContent?.trim().toUpperCase(), tab);
                if (txt && (txt.includes('TID') || txt.includes('TIN'))) {
                    await tab.click();
                    tidClicked = true;
                    console.log('[GDT Agent] 鉁?Strategy A: clicked TID tab via ul.nav-tabs');
                    break;
                }
            }
            // Fallback: TID is 3rd tab (index 2) on GDT portal
            if (!tidClicked && tabs.length >= 3) {
                await tabs[2].click();
                tidClicked = true;
                console.log('[GDT Agent] 鉁?Strategy A fallback: clicked 3rd tab');
            }
        } catch {
            console.log('[GDT Agent] Strategy A: ul.nav-tabs not found 鈥?trying B');
        }

        // 鈹€鈹€ STRATEGY B: generic nav/tab selectors 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
        if (!tidClicked) {
            const genericSels = [
                '.nav-tabs a', '.nav-link', '[role="tab"]',
                'li.nav-item a', 'a[data-toggle="tab"]', '.tab-item',
            ];
            for (const sel of genericSels) {
                try {
                    const tabs = await page.$$(sel);
                    for (const tab of tabs) {
                        const txt = await page.evaluate(el => el.textContent?.trim().toUpperCase(), tab);
                        if (txt && (txt.includes('TID') || txt.includes('TIN'))) {
                            await tab.click();
                            tidClicked = true;
                            console.log(`[GDT Agent] 鉁?Strategy B: clicked TID via "${sel}"`);
                            break;
                        }
                    }
                    if (tidClicked) break;
                } catch { /* continue */ }
            }
        }

        // 鈹€鈹€ STRATEGY C: XPath text search 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
        if (!tidClicked) {
            try {
                const [tidEl] = await page.$x(
                    '//*[contains(text(),"TID") or contains(text(),"TIN")]' +
                    '[self::a or self::button or self::li or self::span]'
                );
                if (tidEl) {
                    await tidEl.click();
                    tidClicked = true;
                    console.log('[GDT Agent] 鉁?Strategy C: clicked TID via XPath');
                }
            } catch { /* ignore */ }
        }

        if (!tidClicked) {
            console.warn('[GDT Agent] 鈿?Could not find TID tab 鈥?may already be on TID form, continuing');
        }

        await wait(1000);

        // 鈹€鈹€ FILL USERNAME / TIN 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
        const tinSelectors = [
            '#username', '#tin', '#userId', '#user_id',
            'input[name="username"]', 'input[name="tin"]', 'input[name="userId"]',
            'input[placeholder*="TIN"]', 'input[placeholder*="TID"]',
            'input[placeholder*="sername"]', 'input[type="text"]',
        ];
        const tinResult = await trySelectors(page, tinSelectors, 6000);
        if (!tinResult) throw new Error('Could not find TIN/Username input on GDT login page');

        await tinResult.el.click({ clickCount: 3 });
        await tinResult.el.type(username, { delay: 60 });
        console.log(`[GDT Agent] 鉁?Filled TIN via "${tinResult.sel}"`);
        await wait(500);

        // 鈹€鈹€ IF PASSWORD IS NOT YET VISIBLE: click Next first 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
        const pwdVisible = await page.$('input[type="password"]');
        if (!pwdVisible) {
            for (const sel of ['button[type="submit"]', 'button.btn-primary', '.btn-login', 'input[type="submit"]']) {
                try {
                    const el = await page.$(sel);
                    if (el) {
                        await el.click();
                        console.log(`[GDT Agent] Clicked Next with "${sel}" (2-step login flow)`);
                        break;
                    }
                } catch { /* continue */ }
            }
            await wait(2000);
        }

        // 鈹€鈹€ FILL PASSWORD 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
        const pwdSelectors = [
            'input[type="password"]', 'input[name="password"]',
            '#password', '#pwd', '#pass',
        ];
        const pwdResult = await trySelectors(page, pwdSelectors, 6000);
        if (pwdResult) {
            await pwdResult.el.click({ clickCount: 3 });
            await pwdResult.el.type(password, { delay: 60 });
            console.log(`[GDT Agent] 鉁?Filled password via "${pwdResult.sel}"`);
            await wait(500);

            // 鈹€鈹€ CLICK SEND CODE 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
            for (const sel of ['button[type="submit"]', 'button.btn-primary', '.btn-login', 'input[type="submit"]']) {
                try {
                    const el = await page.$(sel);
                    if (el) {
                        await el.click();
                        console.log('[GDT Agent] 鉁?Clicked Send Code');
                        break;
                    }
                } catch { /* continue */ }
            }
        } else {
            console.warn('[GDT Agent] 鈿?Password field not found 鈥?OTP may still be triggered');
        }

        await wait(3000);

        // 鈹€鈹€ FINAL STATE SCREENSHOT 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
        const screenshot = await page.screenshot({ encoding: 'base64', type: 'png' });
        const pageTitle  = await page.title().catch(() => '');
        const pageUrl    = page.url();

        // Store session in memory
        sessions.set(sessionId, { browser, page, status: 'otp_pending', createdAt: Date.now() });

        // Auto-cleanup after 10 minutes
        setTimeout(() => {
            const s = sessions.get(sessionId);
            if (s) { s.browser.close().catch(() => {}); sessions.delete(sessionId); }
        }, 10 * 60 * 1000);

        return { sessionId, status: 'otp_sent', pageUrl, pageTitle, screenshot, diagShot, diagUrl };

    } catch (err) {
        // Capture error screenshot before closing
        let errShot = null;
        try { errShot = await page.screenshot({ encoding: 'base64', type: 'png' }); } catch {}
        await browser.close().catch(() => {});
        const enhanced = new Error(`Agent failed: ${err.message}`);
        enhanced.screenshot = errShot;
        throw enhanced;
    }
}

/**
 * Step 2: Submit OTP to complete GDT login
 */
async function submitOtp(sessionId, otp) {
    const session = sessions.get(sessionId);
    if (!session) throw new Error('Session expired or not found. Please launch again.');

    const { page } = session;

    const otpSelectors = [
        'input[maxlength="6"]', 'input[maxlength="4"]',
        'input[name="otp"]', 'input[name="code"]',
        'input[name="verificationCode"]', '#otp',
        'input[type="number"]', 'input[type="text"]',
    ];

    const otpResult = await trySelectors(page, otpSelectors, 8000);
    if (!otpResult) throw new Error('Could not find OTP input field 鈥?page may have changed');

    await otpResult.el.click({ clickCount: 3 });
    await otpResult.el.type(otp, { delay: 80 });
    console.log(`[GDT Agent] 鉁?Filled OTP via "${otpResult.sel}"`);
    await wait(500);

    // Submit OTP
    for (const sel of ['button[type="submit"]', 'button.btn-primary', '.btn-login', 'input[type="submit"]']) {
        try {
            const el = await page.$(sel);
            if (el) { await el.click(); console.log('[GDT Agent] 鉁?Submitted OTP'); break; }
        } catch { /* continue */ }
    }

    await wait(3000);

    const screenshot = await page.screenshot({ encoding: 'base64', type: 'png' });
    const pageUrl    = page.url();
    const pageTitle  = await page.title().catch(() => '');
    session.status   = 'logged_in';

    return { status: 'otp_submitted', pageUrl, pageTitle, screenshot };
}

/**
 * Close a session explicitly
 */
async function closeSession(sessionId) {
    const session = sessions.get(sessionId);
    if (session) {
        await session.browser.close().catch(() => {});
        sessions.delete(sessionId);
    }
}

module.exports = { launchAndLogin, submitOtp, closeSession };
