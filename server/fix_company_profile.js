const mongoose = require('mongoose');
const CompanyProfile = require('./models/CompanyProfile');
const fs = require('fs');

async function dump() {
  await mongoose.connect('mongodb+srv://admin_gsk:admingsk1235@cluster0.pipzn70.mongodb.net/gksmart_live?appName=Cluster0');
  const d = await CompanyProfile.findOne({ companyNameEn: "GK SMART" });
  if (d) {
    fs.writeFileSync('gksmart_dump.json', JSON.stringify(d, null, 2));
    console.log('Dumped to gksmart_dump.json');
  }
  process.exit();
}

dump();
