/**
 * GDT Agent Service — Puppeteer-based headless automation
 * 
 * Flow:
 *   1. launchAndLogin(username, password)  → fills TIN/pass, clicks Send Code
 *   2. submitOtp(sessionId, otp)           → enters OTP, completes login
 *   3. Session is kept alive in memory for OTP step
 */

const puppeteer = require('puppeteer-core');

const GDT_URL = 'https://owp.tax.gov.kh/gdtowpcoreweb/login';
const EXEC_PATH = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium';

// In-memory session store { sessionId: { browser, page, status } }
const sessions = new Map();

function makeSessionId() {
    return `gdt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Step 1: Open GDT, select TID tab, fill credentials, click Send Code
 * Returns { sessionId, status: 'otp_sent' } on success
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
            '--single-process'
        ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    try {
        console.log(`[GDT Agent] Navigating to ${GDT_URL}`);
        await page.goto(GDT_URL, { waitUntil: 'networkidle2', timeout: 30000 });

        // Click the TID tab (3rd tab)
        await page.waitForSelector('ul.nav-tabs li', { timeout: 15000 });
        const tabs = await page.$$('ul.nav-tabs li a, .tab-content .nav-item a, [role="tab"]');
        
        // Try clicking the TID tab — it's usually the 3rd tab
        let tidClicked = false;
        for (const tab of tabs) {
            const text = await page.evaluate(el => el.textContent?.trim(), tab);
            if (text && text.toUpperCase().includes('TID')) {
                await tab.click();
                tidClicked = true;
                console.log('[GDT Agent] Clicked TID tab');
                break;
            }
        }

        if (!tidClicked) {
            // Fallback: try clicking by index (TID is usually tab index 2)
            const allTabs = await page.$$('li.nav-item a, .nav-tabs a');
            if (allTabs.length >= 3) {
                await allTabs[2].click();
                console.log('[GDT Agent] Clicked 3rd tab (TID fallback)');
            }
        }

        await new Promise(r => setTimeout(r, 800));

        // Fill TIN / Username
        const inputSelectors = ['input[type="text"]', 'input[name="username"]', 'input[placeholder*="TIN"]', 'input[placeholder*="TID"]', '#username', '#tin'];
        let tinFilled = false;
        for (const sel of inputSelectors) {
            try {
                const el = await page.$(sel);
                if (el) {
                    await el.click({ clickCount: 3 });
                    await el.type(username, { delay: 50 });
                    tinFilled = true;
                    console.log(`[GDT Agent] Filled TIN with selector: ${sel}`);
                    break;
                }
            } catch {}
        }

        if (!tinFilled) throw new Error('Could not find TIN input field on GDT page');

        await new Promise(r => setTimeout(r, 500));

        // Click "Next / ចូល" or the submit button to get to password page
        const btnSelectors = ['button[type="submit"]', 'button.btn-primary', '.btn-login', 'input[type="submit"]'];
        for (const sel of btnSelectors) {
            try {
                const el = await page.$(sel);
                if (el) {
                    await el.click();
                    console.log(`[GDT Agent] Clicked submit/next with: ${sel}`);
                    break;
                }
            } catch {}
        }

        await new Promise(r => setTimeout(r, 1500));

        // Fill Password (may appear after TIN step)
        const pwdSelectors = ['input[type="password"]', 'input[name="password"]', '#password'];
        let pwdFilled = false;
        for (const sel of pwdSelectors) {
            try {
                const el = await page.$(sel);
                if (el) {
                    await el.click({ clickCount: 3 });
                    await el.type(password, { delay: 50 });
                    pwdFilled = true;
                    console.log(`[GDT Agent] Filled password with selector: ${sel}`);
                    break;
                }
            } catch {}
        }

        if (pwdFilled) {
            // Click Send Code / Login
            for (const sel of btnSelectors) {
                try {
                    const el = await page.$(sel);
                    if (el) {
                        await el.click();
                        console.log(`[GDT Agent] Clicked Send Code button`);
                        break;
                    }
                } catch {}
            }
        }

        await new Promise(r => setTimeout(r, 2000));

        // Take a diagnostic screenshot
        const screenshot = await page.screenshot({ encoding: 'base64', type: 'png' });
        const pageTitle = await page.title().catch(() => '');
        const pageUrl = page.url();

        // Store session
        sessions.set(sessionId, { browser, page, status: 'otp_pending', createdAt: Date.now() });

        // Auto-cleanup session after 10 minutes
        setTimeout(() => {
            const s = sessions.get(sessionId);
            if (s) { s.browser.close().catch(() => {}); sessions.delete(sessionId); }
        }, 10 * 60 * 1000);

        return { sessionId, status: 'otp_sent', pageUrl, pageTitle, screenshot };

    } catch (err) {
        await browser.close().catch(() => {});
        throw err;
    }
}

/**
 * Step 2: Enter OTP into the open GDT session
 */
async function submitOtp(sessionId, otp) {
    const session = sessions.get(sessionId);
    if (!session) throw new Error('Session expired or not found. Please launch again.');

    const { page } = session;

    // Find OTP input
    const otpSelectors = ['input[type="text"]', 'input[name="otp"]', 'input[name="code"]', 'input[maxlength="6"]', '#otp'];
    let otpFilled = false;
    for (const sel of otpSelectors) {
        try {
            const el = await page.$(sel);
            if (el) {
                await el.click({ clickCount: 3 });
                await el.type(otp, { delay: 80 });
                otpFilled = true;
                console.log(`[GDT Agent] Filled OTP with selector: ${sel}`);
                break;
            }
        } catch {}
    }

    if (!otpFilled) throw new Error('Could not find OTP input field');

    await new Promise(r => setTimeout(r, 500));

    // Submit OTP
    const btnSelectors = ['button[type="submit"]', 'button.btn-primary', '.btn-login', 'input[type="submit"]'];
    for (const sel of btnSelectors) {
        try {
            const el = await page.$(sel);
            if (el) { await el.click(); break; }
        } catch {}
    }

    await new Promise(r => setTimeout(r, 2000));
    const screenshot = await page.screenshot({ encoding: 'base64', type: 'png' });
    const pageUrl = page.url();
    const pageTitle = await page.title().catch(() => '');

    session.status = 'logged_in';

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
