const mongoose = require('mongoose');
require('dotenv').config();

async function fix() {
    await mongoose.connect(process.env.MONGODB_URI);
    const User = mongoose.connection.db.collection('users');
    const result = await User.updateOne(
        { username: 'GKSMART' },
        { $set: { role: 'user' } }
    );
    console.log(`Updated GKSMART to user: ${result.modifiedCount} matches`);
    await mongoose.connection.close();
    process.exit(0);
}
fix();
