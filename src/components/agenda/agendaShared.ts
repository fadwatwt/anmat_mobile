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

export function fmtTime(time?: string) {
  if (!time) return '';
  return time;
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
