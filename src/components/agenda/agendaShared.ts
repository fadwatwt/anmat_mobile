export const PRIORITY_COLORS: Record<string, string> = {
  low: '#9CA3AF',
  medium: '#375DFB',
  high: '#F17B2C',
  urgent: '#DF1C41',
};

export const CATEGORY_COLORS: Record<string, string> = {
  meeting: '#375DFB',
  task: '#10B981',
  project: '#7E3AF2',
  interview: '#F59E0B',
  training: '#0EA5E9',
  deadline: '#EF4444',
  reminder: '#EC4899',
  other: '#6B7280',
};

export const CATEGORY_OPTIONS = ['meeting', 'task', 'project', 'interview', 'training', 'deadline', 'other'];
export const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'urgent'];

export const TASK_CATEGORY_OPTIONS = [
  'follow_up', 'review', 'analysis', 'design', 'coding', 'testing', 'documentation', 'communication', 'other',
];

export const REMINDER_OPTIONS = [
  { value: '5_min', key: '5 minutes before' },
  { value: '15_min', key: '15 minutes before' },
  { value: '1_hour', key: '1 hour before' },
  { value: '1_day', key: '1 day before' },
  { value: '1_week', key: '1 week before' },
];

export const REMINDER_COLOR = '#F59E0B';

export function fmtTime(time?: string) {
  if (!time) return '';
  return time;
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
