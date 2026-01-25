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
app.use(helmet());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/company', require('./routes/company'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/tax', require('./routes/tax'));
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

        // Start Server ONLY after DB is ready
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

    } catch (err) {
        console.error('MongoDB Connection Failed:', err.message);
        process.exit(1); // Exit if DB fails so Cloud Run restarts the container
    }
};

startServer();
