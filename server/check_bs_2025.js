const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;

  const bsAll = await db.collection('bankstatements').find({}).toArray();
  const bs2025 = bsAll.filter(bs => {
    if (bs.date && typeof bs.date === 'string' && bs.date.includes('2025')) return true;
    if (bs.date && bs.date instanceof Date && bs.date.getFullYear() === 2025) return true;
    // check rawDate or similar
    if (bs.rawDate && typeof bs.rawDate === 'string' && bs.rawDate.includes('2025')) return true;
    return false;
  });
  console.log('2025 BS count by manual filter:', bs2025.length);
  if(bs2025.length > 0) {
    console.log('Sample BS:', bs2025[0]);
  } else {
    console.log('No 2025 BS found whatsoever.');
    // Let's print out some years we DO have:
    const years = new Set();
    bsAll.forEach(bs => {
      let d = bs.date;
      if (d instanceof Date) years.add(d.getFullYear());
      else if (typeof d === 'string') years.add(d.substring(0, 4));
    });
    console.log('Available years in BS:', Array.from(years));
  }
  
  process.exit(0);
});
