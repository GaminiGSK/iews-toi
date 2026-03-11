const mongoose = require('mongoose');
const ProfileTemplate = require('./models/ProfileTemplate');

async function fix() {
  await mongoose.connect('mongodb+srv://admin_gsk:admingsk1235@cluster0.pipzn70.mongodb.net/gksmart_live?appName=Cluster0');
  const doc = await ProfileTemplate.findOne({ 'sections.entityNameKh': 'ជីខេ ស្មាត' });
  if (doc) {
    const sectionIndex = doc.sections.findIndex(s => s.addressKh);
    if (sectionIndex !== -1) {
      console.log('Old Khmer Address:', doc.sections[sectionIndex].addressKh);
      doc.sections[sectionIndex].addressKh = 'យូនីត ឌី៤១៤ ជាន់ទី៤ អគារអារ៉ាខាវ៉ា ភ័យសិដេន ផ្លូវគ្មាន ភូមិអ័រគីដេ សង្កាត់អូរបែកក្អម ខណ្ឌសែនសុខ រាជធានីភ្នំពេញ កម្ពុជា';
      await doc.save();
      console.log('Update Complete - New Khmer Address set to Unit D414 fully Khmer.');
    } else {
      console.log('Address KH field not found.');
      // find section with addressEn
      for (let i = 0; i < doc.sections.length; i++) {
        if (doc.sections[i].addressEn) {
           doc.sections[i].addressKh = 'យូនីត ឌី៤១៤ ជាន់ទី៤ អគារអារ៉ាខាវ៉ា រ៉េស៊ីដេន ផ្លូវគ្មាន ភូមិអ័រគីដេ សង្កាត់អូរបែកក្អម ខណ្ឌសែនសុខ រាជធានីភ្នំពេញ កម្ពុជា';
           await doc.save();
           console.log('Updated by finding addressEn');
        }
      }
    }
  } else {
    // Try without entityNameKh
    const alldocs = await ProfileTemplate.find({});
    console.log('Found docs:', alldocs.length);
    for (let d of alldocs) {
       for (let i = 0; i < d.sections.length; i++) {
           if (d.sections[i].addressEn && d.sections[i].addressEn.includes('Arakawa')) {
               console.log('Found doc!', d._id);
               console.log('Old Khmer Address:', d.sections[i].addressKh);
               d.sections[i].addressKh = 'យូនីត ឌី៤១៤ ជាន់ទី៤ អគារអារ៉ាខាវ៉ា រ៉េស៊ីដេន ផ្លូវគ្មាន ភូមិអ័រគីដេ សង្កាត់អូរបែកក្អម ខណ្ឌសែនសុខ រាជធានីភ្នំពេញ កម្ពុជា';
               await d.save();
               console.log('Fixed using English fallback search.');
           }
       }
    }
  }
  process.exit();
}

fix();
