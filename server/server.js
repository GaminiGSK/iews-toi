require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
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
// app.use('/uploads', express.static('uploads')); // Disabled for Cloud Persistence Safety

// Serve Frontend in Production
const path = require('path');
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/dist')));

    app.get(/.*/, (req, res) => {
        // Don't interfere with API routes
        if (req.path.startsWith('/api')) return res.status(404).send('API not found');
        res.sendFile(path.resolve(__dirname, '../client', 'dist', 'index.html'));
    });
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
        const http = require('http');
        const { Server } = require('socket.io');
        const server = http.createServer(app);

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

    } catch (err) {
        console.error('MongoDB Connection Failed:', err.message);
        process.exit(1); // Exit if DB fails so Cloud Run restarts the container
    }
};

startServer();
