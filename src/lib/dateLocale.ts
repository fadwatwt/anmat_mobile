import i18n from '../i18n';

const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const AR_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

export const getMonthLabel = (label: string): string => {
  if (i18n.language !== 'ar' || typeof label !== 'string') return label;
  const idx = EN_MONTHS.indexOf(label);
  return idx === -1 ? label : AR_MONTHS[idx];
};

export const formatDate = (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const locale = i18n.language === 'ar' ? 'ar-SA' : 'en-US';
  return d.toLocaleDateString(locale, options);
};
