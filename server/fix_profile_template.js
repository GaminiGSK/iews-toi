const mongoose = require('mongoose');
const ProfileTemplate = require('./models/ProfileTemplate');

async function fix() {
  await mongoose.connect('mongodb+srv://admin_gsk:admingsk1235@cluster0.pipzn70.mongodb.net/gksmart_live?appName=Cluster0');
  
  const docs = await ProfileTemplate.find({});
  for (let d of docs) {
    let changed = false;
    for (let i = 0; i < d.sections.length; i++) {
        let f = d.sections[i].fields;
        if(f) {
           for(let j = 0; j < f.length; j++){
               if(f[j].value && typeof f[j].value === 'string' && f[j].value.includes('Arakawa')){
                   f[j].value = f[j].value.replace(/Unit D414.*?កម្ពុជា/g, 'យូនីត ឌី៤១៤ ជាន់ទី៤ អគារអារ៉ាខាវ៉ា រ៉េស៊ីដេន ផ្លូវគ្មាន ភូមិអ័រគីដេ សង្កាត់អូរបែកក្អម ខណ្ឌសែនសុខ រាជធានីភ្នំពេញ កម្ពុជា');
                   f[j].value = f[j].value.replace(/Unit D414.*?khmer/ig, 'យូនីត ឌី៤១៤ ជាន់ទី៤ អគារអារ៉ាខាវ៉ា រ៉េស៊ីដេន ផ្លូវគ្មាន ភូមិអ័រគីដេ សង្កាត់អូរបែកក្អម ខណ្ឌសែនសុខ រាជធានីភ្នំពេញ កម្ពុជា');
                   changed = true;
               }
           }
        }
    }
    
    // Also try checking the raw object in case Address is stored directly.
    let anyString = JSON.stringify(d);
    if(anyString.includes('Arakawa Residence Block')) {
       // We can just dump and replace and restore
       const obj = d.toObject();
       let str = JSON.stringify(obj);
       str = str.replace(/Unit D414, ជាន់ទី៤, គ្មាន, Arakawa Residence Block, ផ្សារទឹកថ្លា, ទឹកថ្លា, សែនសុខ, រាជធានីភ្នំពេញ, កម្ពុជា/g, 'យូនីត ឌី៤១៤ ជាន់ទី៤ អគារអារ៉ាខាវ៉ា រ៉េស៊ីដេន ផ្លូវគ្មាន ភូមិអ័រគីដេ សង្កាត់អូរបែកក្អម ខណ្ឌសែនសុខ រាជធានីភ្នំពេញ កម្ពុជា');
       const updatedObj = JSON.parse(str);
       await ProfileTemplate.updateOne({_id: d._id}, {$set: updatedObj});
       console.log('Fixed ProfileTemplate obj replacement', d._id);
    }
  }

  process.exit();
}

fix();
