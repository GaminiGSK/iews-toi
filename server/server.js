require('dotenv').config();
// BUILD TRIGGER: 2026-01-31_CheckKey
// Verify Env Load
const geminiKey = process.env.GEMINI_API_KEY;
console.log(`[Startup] Environment Loaded. Gemini Key Status: ${geminiKey ? 'Present (Ends in ' + geminiKey.slice(-4) + ')' : 'MISSING ❌'}`);
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf ? buf.toString() : '';
    }
}));
app.use(cors());
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "img-src": ["'self'", "data:", "blob:", "https:", "http:"],
            "connect-src": ["'self'", "ws:", "wss:", "https:", "http:"],
        },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/company', require('./routes/company'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/tax', require('./routes/tax'));
app.use('/api/copilotkit', require('./routes/copilot'));
app.use('/api/management', require('./routes/management'));
app.use('/uploads', express.static('uploads')); // Enabled for Local Fallback Access

// Serve Frontend in Production
// Serve Frontend (Production or Local Dist)
const path = require('path');
const clientDist = path.join(__dirname, '../client/dist');
const fs = require('fs');

// Always serve 'dist' if it exists (allows verifying build locally)
if (fs.existsSync(clientDist)) {
    console.log(`[Server] Serving Static Frontend from ${clientDist}`);
    app.use(express.static(clientDist));

    app.get(/.*/, (req, res) => {
        // Don't interfere with API routes or uploads
        if (req.path.startsWith('/api')) return res.status(404).send('API not found');
        if (req.path.startsWith('/uploads')) return res.status(404).send('File not found');

        res.sendFile(path.resolve(clientDist, 'index.html'));
    });
} else if (process.env.NODE_ENV === 'production') {
    console.error('Frontend build not found in production!');
}

// Database Connection
// Database Connection & Server Start
const startServer = async () => {
    try {
        console.log('Attempting to connect to MongoDB...');
        console.log('Tax Persistence Module Loaded (v2.5)');
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 30000 // 30s Timeout for Cold Starts
        });
        console.log('MongoDB Connected Successfully');

        // Seed Admins
        const User = require('./models/User');
        const bcrypt = require('bcryptjs');
        const adminCount = await User.countDocuments({ role: 'admin' });
        if (adminCount === 0) {
            console.log('Seeding initial admins...');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);

            await User.create([
                { companyCode: 'ADMIN01', password: hashedPassword, role: 'admin', isFirstLogin: true },
                { companyCode: 'ADMIN02', password: hashedPassword, role: 'admin', isFirstLogin: true }
            ]);
            console.log('Admins seeded');
        }

        // Apply Gate Code Logic
        try {
            const authRoutes = require('./routes/auth');
            // Check if initGateCodes is exported or just rely on module load
            // It runs on load in auth.js, so requiring it above is fine.
        } catch (e) {
            console.error("Auth init error", e);
        }

        // Initialize Socket.io (Phase 4: Neural Link)
        const fs = require('fs');
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
            console.log(`[Neural Link] Client Connected: ${socket.id}`);

            socket.on('disconnect', () => {
                console.log(`[Neural Link] Client Disconnected: ${socket.id}`);
            });

            // Tax Workspace Events
            socket.on('workspace:join', (data) => {
                const { packageId } = data;
                console.log(`[Tax Workspace] Client joined package ${packageId}`);
                require('./agents/TaxAgent').onWorkspaceEnter(socket, packageId);
            });

            socket.on('workspace:perform_action', async (data) => {
                const { action, packageId, params } = data;
                const TaxAgent = require('./agents/TaxAgent');

                if (action === 'fill_year') {
                    await TaxAgent.fillFiscalContext(socket, packageId, params.year);
                } else if (action === 'fill_company') {
                    await TaxAgent.fillCompanyDetails(socket, packageId, params.companyCode);
                }
            });
        });

        // Start Server ONLY after DB is ready
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT} (with Neural Link active)`);
        });

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
        console.error('MongoDB Connection Failed:', err.message);
        process.exit(1); // Exit if DB fails so Cloud Run restarts the container
    }
};

startServer();
