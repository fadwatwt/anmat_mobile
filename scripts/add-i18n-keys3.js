const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const arPath = path.join(root, 'src/locales/ar/translation.json');
const enPath = path.join(root, 'src/locales/en/translation.json');

const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

const additions = {
  'Assignment': 'التعيين',
  'Dates': 'التواريخ',
  'Dates & Progress': 'التواريخ والتقدم',
  'Employees Count': 'عدد الموظفين',
  'Enter project description': 'أدخل وصف المشروع',
  'Enter project name': 'أدخل اسم المشروع',
  'Main Info': 'المعلومات الأساسية',
  'Organizations': 'المؤسسات',
  'Project Information': 'معلومات المشروع',
  'Task Info': 'معلومات المهمة',
  'Ticket': 'التذكرة',
  // status enums (lowercase / backend values)
  'upcoming': 'قادم',
  'completed': 'مكتمل',
  'in_progress': 'قيد التنفيذ',
  'on_hold': 'معلّق',
};

let arAdded = 0;
let enAdded = 0;
for (const [key, val] of Object.entries(additions)) {
  if (!(key in ar)) { ar[key] = val; arAdded++; }
  if (!(key in en)) { en[key] = key; enAdded++; }
}

function serialize(obj, originalText) {
  const crlf = originalText.includes('\r\n');
  let out = JSON.stringify(obj, null, 2);
  if (crlf) out = out.replace(/\n/g, '\r\n');
  out += crlf ? '\r\n' : '\n';
  return out;
}

fs.writeFileSync(arPath, serialize(ar, fs.readFileSync(arPath, 'utf8')), 'utf8');
fs.writeFileSync(enPath, serialize(en, fs.readFileSync(enPath, 'utf8')), 'utf8');

console.log('AR added:', arAdded);
console.log('EN added:', enAdded);
