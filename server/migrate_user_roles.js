require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!uri) {
    console.error('Missing MONGODB_URI');
    process.exit(1);
}

mongoose.connect(uri)
    .then(async () => {
        console.log('MongoDB Connected');
        const db = mongoose.connection.db;
        
        // Find users with 'user' role
        const oldUsers = await db.collection('users').find({ role: 'user' }).toArray();
        console.log(`Found ${oldUsers.length} legacy users with 'user' role.`);
        
        // Update them
        const result = await db.collection('users').updateMany(
            { role: 'user' },
            { $set: { role: 'unit' } }
        );
        
        console.log(`Updated ${result.modifiedCount} legacy users to 'unit' role!`);
        process.exit(0);
    })
    .catch(err => {
        console.error('Error connecting to MongoDB:', err);
        process.exit(1);
    });
