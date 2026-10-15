import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

function hashFile(p: string) {
  const buf = fs.readFileSync(p);
  return crypto.createHash('md5').update(buf).digest('hex');
}

const rootFiles = fs.readdirSync('.').filter((f) => f.startsWith('WhatsApp Image'));
console.log('Total WhatsApp images in root:', rootFiles.length);

const publicFiles = fs.readdirSync('public/products').filter((f) => f.endsWith('.jpg') || f.endsWith('.jpeg'));
const publicMap = new Map<string, string>();
publicFiles.forEach((f) => {
  publicMap.set(hashFile(path.join('public/products', f)), f);
});

let matches = 0;
let newImages = 0;

rootFiles.forEach((rf) => {
  const h = hashFile(rf);
  if (publicMap.has(h)) {
    matches++;
  } else {
    newImages++;
    console.log('Unique/New root image:', rf, `(${fs.statSync(rf).size} bytes)`);
  }
});

console.log(`Summary: ${matches} matched files in public/products, ${newImages} unique/unmatched.`);
