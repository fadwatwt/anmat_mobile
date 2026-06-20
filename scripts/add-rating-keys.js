const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const arPath = path.join(root, 'src/locales/ar/translation.json');
const enPath = path.join(root, 'src/locales/en/translation.json');

const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

const additions = {
  'Time Delivery': 'التسليم في الوقت',
  'Quality': 'الجودة',
  'Average Score': 'متوسط التقييم',
  'Write your comments here': 'اكتب تعليقاتك هنا',
  'Please add at least one rating': 'يرجى إضافة تقييم واحد على الأقل',
};

let arAdded = 0;
let enAdded = 0;
for (const [key, val] of Object.entries(additions)) {
  if (!(key in ar)) { ar[key] = val; arAdded++; }
  if (!(key in en)) { en[key] = key; enAdded++; }
}

function serialize(obj, original) {
  const crlf = original.includes('\r\n');
  let out = JSON.stringify(obj, null, 2);
  if (crlf) out = out.replace(/\n/g, '\r\n');
  out += crlf ? '\r\n' : '\n';
  return out;
}

fs.writeFileSync(arPath, serialize(ar, fs.readFileSync(arPath, 'utf8')), 'utf8');
fs.writeFileSync(enPath, serialize(en, fs.readFileSync(enPath, 'utf8')), 'utf8');
console.log('AR added:', arAdded, '| EN added:', enAdded);
