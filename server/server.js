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
app.use('/uploads', express.static('uploads'));

// Serve Frontend in Production
const path = require('path');
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/dist')));

    app.get('*', (req, res) => {
        // Don't interfere with API routes
        if (req.path.startsWith('/api')) return res.status(404).send('API not found');
        res.sendFile(path.resolve(__dirname, '../client', 'dist', 'index.html'));
    });
}

// Database Connection
// Database Connection
const connectDB = async () => {
    try {
        console.log('Attempting to connect to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000 // Fail after 5s if not found
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

    } catch (err) {
        console.error('MongoDB Connection Failed:', err.message);
        // Do not exit, let it retry or stay up (though API will fail)
    }
};

connectDB();

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
