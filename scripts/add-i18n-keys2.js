const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const arPath = path.join(root, 'src/locales/ar/translation.json');
const enPath = path.join(root, 'src/locales/en/translation.json');

const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

const additions = {
  '(Only employees without department)': '(الموظفون بدون قسم فقط)',
  'Account Type': 'نوع الحساب',
  'Action failed': 'فشلت العملية',
  'Are you sure you want to cancel the subscription renewal?': 'هل أنت متأكد من إلغاء تجديد الاشتراك؟',
  'Auto renewal disabled': 'تم تعطيل التجديد التلقائي',
  'Auto renewal enabled': 'تم تفعيل التجديد التلقائي',
  'Cancel Renewal': 'إلغاء التجديد',
  'Choose a token pack to continue using the AI assistant': 'اختر باقة رموز لمواصلة استخدام المساعد الذكي',
  'Do you want to reactivate the subscription renewal?': 'هل تريد إعادة تفعيل تجديد الاشتراك؟',
  'Enter new name': 'أدخل الاسم الجديد',
  'Enter valid trial days': 'أدخل عدد أيام تجربة صحيح',
  'Expires': 'تنتهي في',
  'Failed to assign employees': 'فشل في تعيين الموظفين',
  'Failed to cancel renewal': 'فشل في إلغاء التجديد',
  'Failed to reactivate renewal': 'فشل في إعادة تفعيل التجديد',
  'Failed to send invitation': 'فشل في إرسال الدعوة',
  'Failed to send message': 'فشل في إرسال الرسالة',
  'Failed to subscribe.': 'فشل في الاشتراك.',
  'Free': 'مجاني',
  'Free Trial': 'تجربة مجانية',
  'How can I help you today?': 'كيف يمكنني مساعدتك اليوم؟',
  'Invalid number': 'رقم غير صالح',
  'Invalid price': 'سعر غير صالح',
  'New Project': 'مشروع جديد',
  'New conversation': 'محادثة جديدة',
  'No': 'لا',
  'No active plans found': 'لا توجد خطط نشطة',
  'No billing history found': 'لا يوجد سجل فواتير',
  'No conversations': 'لا توجد محادثات',
  'No data': 'لا توجد بيانات',
  'No employees found': 'لا يوجد موظفون',
  'No packages available': 'لا توجد باقات متاحة',
  'No payments': 'لا توجد مدفوعات',
  'No plans available': 'لا توجد خطط متاحة',
  'No results': 'لا توجد نتائج',
  'No subscribers found': 'لا يوجد مشتركون',
  'No subscriptions': 'لا توجد اشتراكات',
  'No subscriptions to display': 'لا توجد اشتراكات لعرضها',
  'No token packages found': 'لا توجد باقات رموز',
  'Not connected to chat server': 'غير متصل بخادم المحادثة',
  'Not evaluated': 'لم يتم التقييم',
  'Offline': 'غير متصل',
  'Out of tokens — Buy more': 'نفدت الرموز — اشترِ المزيد',
  'Power Up Your AI': 'عزّز مساعدك الذكي',
  'Purchase Successful': 'تمت عملية الشراء بنجاح',
  'Reactivate Renewal': 'إعادة تفعيل التجديد',
  'Recent Activity': 'النشاط الأخير',
  'Search employees...': 'ابحث عن موظفين...',
  'Select category...': 'اختر الفئة...',
  'Select department...': 'اختر القسم...',
  'Select employees...': 'اختر الموظفين...',
  'Select feature type...': 'اختر نوع الميزة...',
  'Select interval...': 'اختر الفترة...',
  'Select positions...': 'اختر المناصب...',
  'Select priority...': 'اختر الأولوية...',
  'Select type...': 'اختر النوع...',
  'Select...': 'اختر...',
  'Server': 'الخادم',
  'Shift End': 'نهاية الوردية',
  'Shift Start': 'بداية الوردية',
  'Start': 'ابدأ',
  'Subscription started': 'تم بدء الاشتراك',
  'Subscription updated successfully.': 'تم تحديث الاشتراك بنجاح.',
  'This page is under development': 'هذه الصفحة قيد التطوير',
  'Toggle Status': 'تبديل الحالة',
  'Tokens purchased successfully using your default card.': 'تم شراء الرموز بنجاح باستخدام بطاقتك الافتراضية.',
  'Unknown user type': 'نوع مستخدم غير معروف',
  'User type: ': 'نوع المستخدم: ',
  'Yearly': 'سنوي',
  'Yes, Reactivate': 'نعم، أعد التفعيل',
  'You do not have an active subscription': 'ليس لديك اشتراك نشط',
  "You've run out of tokens. Tap to buy more.": 'لقد نفدت الرموز. اضغط لشراء المزيد.',
  'edited': 'تم التعديل',
  'is required': 'مطلوب',
  'this subscriber': 'هذا المشترك',
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
