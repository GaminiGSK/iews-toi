const mongoose = require('mongoose');
const CompanyProfile = require('./models/CompanyProfile');

async function fix() {
  await mongoose.connect('mongodb+srv://admin_gsk:admingsk1235@cluster0.pipzn70.mongodb.net/gksmart_live?appName=Cluster0');
  
  const d = await CompanyProfile.findOne({ companyNameEn: "GK SMART" });
  if (d) {
     let str = JSON.stringify(d.toObject());
     
     // Remove mismatched/wrong English mixed Khmer texts
     str = str.replace(/Unit D414, ជាន់ទី៤, គ្មាន, Arakawa Residence Block, ផ្សារទឹកថ្លា, ទឹកថ្លា, សែនសុខ, រាជធានីភ្នំពេញ, កម្ពុជា/g, 'យូនីត ឌី៤១៤ ជាន់ទី៤ អគារអារ៉ាខាវ៉ា រ៉េស៊ីដេន ផ្លូវគ្មាន ភូមិអ័រគីដេ សង្កាត់អូរបែកក្អម ខណ្ឌសែនសុខ រាជធានីភ្នំពេញ កម្ពុជា');
     str = str.replace(/Unit D414, ជាន់ទី៤, ផ្លូវគ្មាន ភូមិអ័រគីដេ សង្កាត់អូរបែកក្អម, ទឹកថ្លា,\\nសែនសុខ, រាជធានីភ្នំពេញ, កម្ពុជា/g, 'យូនីត ឌី៤១៤ ជាន់ទី៤ អគារអារ៉ាខាវ៉ា រ៉េស៊ីដេន ផ្លូវគ្មាន ភូមិអ័រគីដេ សង្កាត់អូរបែកក្អម ខណ្ឌសែនសុខ រាជធានីភ្នំពេញ កម្ពុជា');
     str = str.replace(/#Arakawa Residence Block Unit D៤១៤ ជាន់ទី៤ ផ្លូវ ភូមិផ្សារទឹកថ្លា សង្កាត់ទឹកថ្លា ខណ្ឌសែនសុខ\\nរាជធានីភ្នំពេញ/g, 'យូនីត ឌី៤១៤ ជាន់ទី៤ អគារអារ៉ាខាវ៉ា រ៉េស៊ីដេន ផ្លូវគ្មាន ភូមិអ័រគីដេ សង្កាត់អូរបែកក្អម ខណ្ឌសែនសុខ រាជធានីភ្នំពេញ កម្ពុជា');
     str = str.replace(/#Arakawa Residence Block Unit D៤១៤ ជាន់ទី៤ ផ្លូវ ភូមិផ្សារទឹកថ្លា សង្កាត់ទឹកថ្លា ខណ្ឌសែនសុខ រាជធានីភ្នំពេញ/g, 'យូនីត ឌី៤១៤ ជាន់ទី៤ អគារអារ៉ាខាវ៉ា រ៉េស៊ីដេន ផ្លូវគ្មាន ភូមិអ័រគីដេ សង្កាត់អូរបែកក្អម ខណ្ឌសែនសុខ រាជធានីភ្នំពេញ កម្ពុជា');

     const fixedObj = JSON.parse(str);
     await CompanyProfile.updateOne({ _id: d._id }, { $set: fixedObj });
     console.log('Fixed DB via JSON recursive replace.');
  }

  process.exit();
}

fix();
