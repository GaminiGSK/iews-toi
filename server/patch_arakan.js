const mongoose = require('mongoose');

// Need to safely connect to MongoDB, the user has connection string in server/server.js or server/config/db.js or we can just run this locally
async function fixArakan() {
    try {
        const CompanyProfile = require('./models/CompanyProfile');
        require('dotenv').config();
        
        // Wait, the user's DB connection string is in process.env.MONGO_URI
        await mongoose.connect(process.env.MONGO_URI || "mongodb+srv://user_gks:gamini2025@gksmart-live.x1coy.mongodb.net/test?retryWrites=true&w=majority", {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("Connected to MongoDB.");

        const arakan = await CompanyProfile.findOne({ companyCode: 'ARAKAN' });
        if (arakan) {
            console.log("Found ARAKAN. Updating root fields...");
            arakan.companyNameEn = "ARKAN TECHNOLOGIES CO., LTD.";
            arakan.companyNameKh = "អារ កំន ថេកណឡជី ឯ.ក";
            arakan.vatTin = "K009-902503506";
            arakan.incorporationDate = "28-April-2025";
            arakan.registrationNumber = "1000484744";
            arakan.director = "ALLES TYRONE EDWARD";
            arakan.address = "180/37, Palliyawatha, Hendala, Wattala, Sri Lanka., Sri Lanka";
            arakan.businessActivity = "62010 Computer programming activities(2)";
            
            await arakan.save();
            console.log("Successfully patched ARAKAN profile.");
        } else {
            console.log("ARAKAN not found!");
        }

        mongoose.connection.close();
    } catch(e) {
        console.error(e);
        mongoose.connection.close();
    }
}
fixArakan();
