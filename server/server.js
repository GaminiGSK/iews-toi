require('dotenv').config();
// BUILD TRIGGER: 2026-01-31_CheckKey
// Verify Env Load
const geminiKey = process.env.GEMINI_API_KEY;
console.log(`[Startup] Environment Loaded. Gemini Key Status: ${geminiKey ? 'Present (Ends in ' + geminiKey.slice(-4) + ')' : 'MISSING ❌'}`);
console.log('[Debug] Req express...');
const express = require('express');
console.log('[Debug] Req mongoose...');
const mongoose = require('mongoose');
console.log('[Debug] Req cors...');
const cors = require('cors');
console.log('[Debug] Req helmet...');
const helmet = require('helmet');
console.log('[Debug] Req morgan...');
const morgan = require('morgan');
console.log('[Startup] Loading Auth Routes...');
const authRoutes = require('./routes/auth');
console.log('[Startup] Auth Routes Loaded.');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json({
    limit: '50mb', // Increased for Excel JSON
    verify: (req, res, buf) => {
        req.rawBody = buf ? buf.toString() : '';
    }
}));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

// Relaxed Helmet for Debugging White Screen
app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for now to test if it's blocking Vite assets
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(morgan('dev'));

console.log(`[Startup] Port: ${PORT}, Node Env: ${process.env.NODE_ENV}`);

// Health Check (For Cloud Run Self-Healing)
app.get('/health', (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'DB Connected' : 'DB Disconnected';
    res.status(200).json({ status: 'OK', database: dbStatus, timestamp: new Date() });
});

// Routes
console.log('[Startup] Loading API Routes...');
app.use('/api/auth', authRoutes);
app.use('/api/company', require('./routes/company'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/tax', require('./routes/tax'));
app.use('/api/copilotkit', require('./routes/copilot'));
app.use('/api/management', require('./routes/management'));
app.use('/api/excel', require('./routes/excel'));
app.use('/api/vision', require('./routes/vision'));
app.use('/api/bridge', require('./routes/bridge'));
app.use('/api/knowledge', require('./routes/knowledge'));
console.log('[Startup] API Routes Loaded.');
app.use('/uploads', express.static('uploads'));

// Serve Frontend in Production
// Serve Frontend (Production or Local Dist)
const path = require('path');
const clientDist = path.join(__dirname, '../client/dist');
const fs = require('fs');

if (fs.existsSync(clientDist)) {
    console.log(`[Server] Serving Static Frontend from ${clientDist}`);

    // Serve static assets EXCEPT index.html through express.static
    app.use(express.static(clientDist, { index: false }));

    app.get('/{*path}', (req, res) => {
        // Skip for API and uploads
        if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
            return res.status(404).json({ error: 'Endpoint not found' });
        }

        // Force no-cache for index.html (the entry point)
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.sendFile(path.resolve(clientDist, 'index.html'));
    });
} else if (process.env.NODE_ENV === 'production') {
    console.error('Frontend build not found in production!');
}

// CACHE BUSTER VERSION: 2026-02-20_1920_EMERALD_SYNC

// Database Connection
// Database Connection & Server Start
const startServer = async () => {
    try {
        // --- 1. Initialize Server & Socket.io ---
        // fs is already required at top level
        const http = require('http');
        const https = require('https');
        const { Server } = require('socket.io');

        // Optionally enable mTLS (mutual TLS) if environment variables are set
        let server;
        const MTLS_REQUIRED = process.env.MTLS_REQUIRED === 'true';
        if (MTLS_REQUIRED) {
            const keyPath = process.env.MTLS_SERVER_KEY_PATH;
            const certPath = process.env.MTLS_SERVER_CERT_PATH;
            const caPath = process.env.MTLS_CA_PATH;
            if (!keyPath || !certPath || !caPath) {
                console.error('[mtls] MTLS_REQUIRED is set but MTLS_SERVER_KEY_PATH, MTLS_SERVER_CERT_PATH or MTLS_CA_PATH is missing');
                process.exit(1);
            }
            const options = {
                key: fs.readFileSync(keyPath),
                cert: fs.readFileSync(certPath),
                ca: fs.readFileSync(caPath),
                requestCert: true,
                rejectUnauthorized: true
            };
            server = https.createServer(options, app);
            console.log('[mtls] HTTPS server started with client certificate verification (mTLS required)');
        } else {
            // Standard HTTP Server
            server = http.createServer(app);
        }

        // Export io for Agents to use
        const io = new Server(server, {
            cors: {
                origin: "*", // allow all for dev/demo
                methods: ["GET", "POST"]
            }
        });

        global.io = io; // Make accessible to Agents

        io.on('connection', (socket) => {
            console.log(`[Logic Link] Client Connected: ${socket.id}`);

            socket.on('disconnect', () => {
                console.log(`[Logic Link] Client Disconnected: ${socket.id}`);
            });

            // Tax Workspace Events
            socket.on('workspace:join', async (data) => {
                const { packageId } = data;
                socket.join(packageId); // Joining the room for collaboration
                console.log(`[Tax Workspace] Client ${socket.id} joined package ${packageId}`);

                // Fetch current data and send to joining client
                try {
                    const TaxPackage = require('./models/TaxPackage');
                    const pkg = await TaxPackage.findById(packageId);
                    if (pkg) {
                        socket.emit('form:data', pkg.data);
                    }
                } catch (e) { }

                require('./agents/TaxAgent').onWorkspaceEnter(socket, packageId);
            });

            socket.on('workspace:perform_action', async (data) => {
                const { action, packageId, params } = data;
                const TaxAgent = require('./agents/TaxAgent');

                if (action === 'fill_year') {
                    await TaxAgent.fillFiscalContext(socket, packageId, params.year);
                } else if (action === 'fill_company') {
                    await TaxAgent.fillCompanyDetails(socket, packageId, params.companyCode);
                } else if (action === 'trigger_analysis') {
                    console.log(`[Admin] AI requested analysis trigger for ${packageId}`);
                    io.emit('admin:trigger_analysis', { packageId });
                }
            });

            socket.on('workspace:update_data', async (data) => {
                const { packageId, update } = data;
                try {
                    const TaxPackage = require('./models/TaxPackage');
                    const pkg = await TaxPackage.findById(packageId);
                    if (pkg) {
                        for (let [key, val] of Object.entries(update)) {
                            pkg.data.set(key, val);
                        }
                        await pkg.save();
                        // Broadcast to others in the same package room
                        socket.to(packageId).emit('form:update', update);
                    }
                } catch (e) {
                    console.error("Workspace update error:", e);
                }
            });
        });

        // --- 2. Start Listening Immediately (Fixes deployment timeouts) ---
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT} (with Logic Link active)`);
        });

        // --- 3. Database Connection ---
        console.log('Attempting to connect to MongoDB...');
        console.log('Tax Persistence Module Loaded (v2.5)');

        // Connect without blocking the port listener (already listening)
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 30000 // 30s Timeout for Cold Starts
        });
        console.log('MongoDB Connected Successfully');

        // Seed Master Accounts (Ensure GK SMART exists)
        const User = require('./models/User');
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('ggmt1235#', salt);

        const masterAccounts = [
            {
                username: 'Admin',
                companyName: 'GK SMART & Ai',
                companyCode: 'ADMIN_GK_SMART',
                password: hashedPassword,
                loginCode: '999999',
                role: 'admin',
                isFirstLogin: false
            },
            {
                username: 'GKSMART',
                companyName: 'GK SMART',
                companyCode: 'GGMT',
                password: hashedPassword,
                loginCode: '666666',
                role: 'user',
                isFirstLogin: false
            }
        ];

        for (const account of masterAccounts) {
            const exists = await User.findOne({ username: account.username });
            if (!exists) {
                await User.create(account);
                console.log(`Created Master Account: ${account.username} (${account.loginCode})`);
            } else {
                // Update code if it exists but is different (optional, but good for enforcement)
                if (exists.loginCode !== account.loginCode && (account.username === 'Admin' || account.username === 'GKSMART')) {
                    exists.loginCode = account.loginCode;
                    await exists.save();
                    console.log(`Restored/Updated code for ${account.username}`);
                }
            }
        }
        console.log('Master Account Status: Verified');

        // Apply Gate Code Logic
        try {
            const authRoutes = require('./routes/auth');
            // Check if initGateCodes is exported or just rely on module load
            // It runs on load in auth.js, so requiring it above is fine.
        } catch (e) {
            console.error("Auth init error", e);
        }

        // Provide a method to reload TLS assets at runtime for cert rotation
        const tls = require('tls');
        global.reloadServerCerts = function () {
            try {
                if (!MTLS_REQUIRED) return false;
                const keyPath = process.env.MTLS_SERVER_KEY_PATH;
                const certPath = process.env.MTLS_SERVER_CERT_PATH;
                const caPath = process.env.MTLS_CA_PATH;
                if (!keyPath || !certPath || !caPath) {
                    console.error('[mtls] Cannot reload certs: env paths not set');
                    return false;
                }
                const key = fs.readFileSync(keyPath);
                const cert = fs.readFileSync(certPath);
                const ca = fs.readFileSync(caPath);
                const ctx = tls.createSecureContext({ key, cert, ca });
                if (typeof server.setSecureContext === 'function') {
                    server.setSecureContext(ctx.context || ctx);
                    console.log('[mtls] TLS context reloaded successfully');
                    return true;
                } else {
                    console.warn('[mtls] server.setSecureContext not available; restart required to reload certs');
                    return false;
                }
            } catch (e) {
                console.error('[mtls] reloadServerCerts failed', e);
                return false;
            }
        };

    } catch (err) {
        console.error('!!! CRITICAL STARTUP ERROR !!!');
        console.error(err);

        // Automated Error Reporting
        try {
            const errorLog = `[${new Date().toISOString()}] CRITICAL: ${err.stack || err.message}\n`;
            fs.appendFileSync(path.join(__dirname, 'server-error.log'), errorLog);
        } catch (e) { }

        process.exit(1);
    }
};

startServer();
