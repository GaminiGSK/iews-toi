const driveAuth = require('./server/services/googleDrive');
require('dotenv').config({ path: './server/.env' });
const fs = require('fs');
const path = require('path');

async function downloadLogo() {
  const drive = await driveAuth.getDrive();
  console.log("Searching for 'BA Audit .jpg'...");
  const res = await drive.files.list({
    q: "name='BA Audit .jpg'",
    fields: 'files(id, name)',
  });
  const files = res.data.files;
  if (files.length === 0) {
    console.log('No files found.');
    return;
  }
  const file = files[0];
  console.log('Found:', file);
  
  const dest = path.join(__dirname, 'client', 'public', 'assets', 'ba_audit_logo.jpg');
  const destStream = fs.createWriteStream(dest);
  
  const dlRes = await drive.files.get(
    { fileId: file.id, alt: 'media' },
    { responseType: 'stream' }
  );
  
  dlRes.data
    .on('end', () => console.log('Downloaded to', dest))
    .on('error', err => console.error('Error downloading:', err))
    .pipe(destStream);
}

downloadLogo().catch(console.error);
