const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const arPath = path.join(root, 'src/locales/ar/translation.json');
const enPath = path.join(root, 'src/locales/en/translation.json');

const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// key -> arabic translation. For placeholders/sample values, AR == key (kept literal).
const additions = {
  '0': '0',
  '05xxxxxxxx': '05xxxxxxxx',
  '9:00 AM - 5:00 PM': '9:00 ص - 5:00 م',
  'Account Number': 'رقم الحساب',
  'Are you sure?': 'هل أنت متأكد؟',
  'Bank Account Number': 'رقم الحساب البنكي',
  'Bank Information': 'المعلومات البنكية',
  'Bank Name': 'اسم البنك',
  'EMP-001': 'EMP-001',
  'Edit Employee Data': 'تعديل بيانات الموظف',
  'Email *': 'البريد الإلكتروني *',
  'Emergency Contact': 'جهة اتصال للطوارئ',
  'Employee Details': 'تفاصيل الموظف',
  'Employee ID': 'معرّف الموظف',
  'Employee added successfully': 'تمت إضافة الموظف بنجاح',
  'Employee data updated successfully': 'تم تحديث بيانات الموظف بنجاح',
  'Employment Type': 'نوع التوظيف',
  'Failed to add employee': 'فشل في إضافة الموظف',
  'Failed to approve request': 'فشل في الموافقة على الطلب',
  'Failed to delete': 'فشل في الحذف',
  'Failed to load employee data': 'فشل في تحميل بيانات الموظف',
  'Failed to reject request': 'فشل في رفض الطلب',
  'Failed to toggle status': 'فشل في تغيير الحالة',
  'Failed to update data': 'فشل في تحديث البيانات',
  'First Name *': 'الاسم الأول *',
  'Full Address': 'العنوان الكامل',
  'Gender': 'الجنس',
  'Hire Date': 'تاريخ التعيين',
  'Last Name *': 'اسم العائلة *',
  'Nationality': 'الجنسية',
  'No financial transactions': 'لا توجد معاملات مالية',
  'No leave records': 'لا توجد سجلات إجازات',
  'Please enter email': 'يرجى إدخال البريد الإلكتروني',
  'Please enter first name': 'يرجى إدخال الاسم الأول',
  'Please enter last name': 'يرجى إدخال اسم العائلة',
  'Previous': 'السابق',
  'Relationship': 'صلة القرابة',
  'Tax Number': 'الرقم الضريبي',
  'Work Schedule': 'جدول العمل',
  'email@example.com': 'email@example.com',
  'this employee': 'هذا الموظف',
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
  // match original trailing newline style
  out += crlf ? '\r\n' : '\n';
  return out;
}

const arOrig = fs.readFileSync(arPath, 'utf8');
const enOrig = fs.readFileSync(enPath, 'utf8');
fs.writeFileSync(arPath, serialize(ar, arOrig), 'utf8');
fs.writeFileSync(enPath, serialize(en, enOrig), 'utf8');

console.log('AR added:', arAdded);
console.log('EN added:', enAdded);
