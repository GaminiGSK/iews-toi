const mongoose = require('mongoose');
const CompanyProfile = require('./models/CompanyProfile');

async function fix() {
  await mongoose.connect('mongodb+srv://admin_gsk:admingsk1235@cluster0.pipzn70.mongodb.net/gksmart_live?appName=Cluster0');
  
  const docs = await CompanyProfile.find({});
  for (let d of docs) {
    if (d.address && d.address.includes('Arakawa')) {
       console.log('Old address:', d.address);
       d.address = 'យូនីត ឌី៤១៤ ជាន់ទី៤ អគារអារ៉ាខាវ៉ា រ៉េស៊ីដេន ផ្លូវគ្មាន ភូមិអ័រគីដេ សង្កាត់អូរបែកក្អម ខណ្ឌសែនសុខ រាជធានីភ្នំពេញ កម្ពុជា\nUnit D414, 4th floor, No., Arakawa Residence Block, Phsar Teuk Thla, Teuk Thla, Sen Sok, Phnom Penh, Cambodia';
       await d.save();
       console.log('Fixed address!');
    }
  }

  process.exit();
}

fix();
