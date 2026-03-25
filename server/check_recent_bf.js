require('dotenv').config();
require('mongoose').connect(process.env.MONGODB_URI).then(async () => {
    const BankFile = require('./models/BankFile');
    const recent = await BankFile.find({ uploadedAt: { $gte: new Date('2026-03-24') } });
    console.log(recent.map(f => ({ id: f._id, companyCode: f.companyCode, orig: f.originalName, isMeta: f.isMetadataOnly, syncErr: f.syncError })));
    process.exit(0);
});
