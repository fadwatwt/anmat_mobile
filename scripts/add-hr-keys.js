const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const arPath = path.join(root, 'src/locales/ar/translation.json');
const enPath = path.join(root, 'src/locales/en/translation.json');

const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

const additions = {
  'Edit Holiday': 'تعديل العطلة',
  'No Holidays': 'لا توجد عطلات',
  'No holidays found': 'لم يتم العثور على عطلات',
  'Edit Team': 'تعديل الفريق',
  'Enter team name': 'أدخل اسم الفريق',
  'Select Team Leader': 'اختر قائد الفريق',
  'Enter a score from 0 to 5': 'أدخل تقييماً من 0 إلى 5',
  'No Teams': 'لا توجد فرق',
  'No teams found': 'لم يتم العثور على فرق',
  'Edit Meeting': 'تعديل الاجتماع',
  'Organizers': 'المنظّمون',
  'Select Organizers': 'اختر المنظّمين',
  'In Person': 'حضوري',
  'No Meetings': 'لا توجد اجتماعات',
  'No meetings found': 'لم يتم العثور على اجتماعات',
  'Set Reminder': 'ضبط تذكير',
  'Remove Reminder': 'إزالة التذكير',
  'Reminder Set': 'تم ضبط التذكير',
  'Reminder Removed': 'تمت إزالة التذكير',
  'A reminder has been added to your agenda.': 'تمت إضافة تذكير إلى أجندتك.',
  'The reminder has been removed.': 'تمت إزالة التذكير.',
  'No meeting link': 'لا يوجد رابط للاجتماع',
  'Could not open the link': 'تعذّر فتح الرابط',
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
