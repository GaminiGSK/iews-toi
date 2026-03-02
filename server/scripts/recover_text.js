const mongoose = require('mongoose');
require('dotenv').config();
const CompanyProfile = require('../models/CompanyProfile');
const User = require('../models/User');

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await User.find({ username: /GKSMART/i });
        console.log(`Users found for GKSMART (Case Insensitive): ${users.length}`);

        for (const u of users) {
            const profiles = await CompanyProfile.find({ user: u._id });
            console.log(`User ID: ${u._id} | Username: ${u.username} | Profiles Found: ${profiles.length}`);
            profiles.forEach((p, i) => {
                console.log(`Profile ${i} (ID: ${p._id}) - Docs: ${p.documents?.length || 0}`);
                if (p.documents?.length > 0) {
                    p.documents.forEach((d, j) => {
                        console.log(`  - Doc ${j}: ${d.originalName} | Text Len: ${d.rawText?.length || 0}`);
                        if (d.rawText && d.rawText.includes("failed")) {
                            console.log(`    >>> ERROR DETECTED <<<`);
                        } else if (d.rawText) {
                            console.log(`    >>> SUCCESS CONTENT FOUND! <<< [ID: ${d._id}]`);
                        }
                    });
                }
            });
        }
        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
}
check();
