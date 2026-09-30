import { http } from '../lib/http';
import { ApiResponse } from '../types';

export type ActivityLogItemLike = {
  action?: string;
  description?: string;
};

// Mirrors web anmat_front-main/src/components/ActivityLogs.jsx TITLE_MAP.
// Backend sends raw keys like "task.attachment_deleted"; this maps them to
// i18n keys ("activity.task.attachment_deleted") present in locales.
const ACTION_TITLE_MAP: Record<string, string> = {
  'task.created': 'activity.task.created',
  'task.evaluated': 'activity.task.evaluated',
  'task.attachment_uploaded': 'activity.task.attachment_uploaded',
  'task.comment_added': 'activity.task.comment_added',
  'task.comment_edited': 'activity.task.comment_edited',
  'task.comment_deleted': 'activity.task.comment_deleted',
  'task.attachment_deleted': 'activity.task.attachment_deleted',
  'task.updated': 'activity.task.updated',
  'task.deleted': 'activity.task.deleted',
  'task.status_changed': 'activity.task.status_changed',
  'task.stage_evaluated': 'activity.task.stage_evaluated',
  'project.comment_added': 'activity.project.comment_added',
  'project.comment_edited': 'activity.project.comment_edited',
  'project.comment_deleted': 'activity.project.comment_deleted',
  'project.attachment_uploaded': 'activity.project.attachment_uploaded',
  'project.attachment_deleted': 'activity.project.attachment_deleted',
  'project.created': 'activity.project.created',
  'project.updated': 'activity.project.updated',
  'project.deleted': 'activity.project.deleted',
  'employee.created': 'activity.employee.created',
  'employee.updated': 'activity.employee.updated',
  'employee.deleted': 'activity.employee.deleted',
  'employee.invited': 'activity.employee.invited',
  'user.login': 'activity.user.login',
  'user.logout': 'activity.user.logout',
  'user.password_changed': 'activity.user.password_changed',
  'user.registered': 'activity.user.registered',
  'department.created': 'activity.department.created',
  'department.updated': 'activity.department.updated',
  'department.deleted': 'activity.department.deleted',
  'department.employees_assigned': 'activity.department.employees_assigned',
  'department.employees_unassigned': 'activity.department.employees_unassigned',
  'role.created': 'activity.role.created',
  'role.deleted': 'activity.role.deleted',
  'role.permissions_updated': 'activity.role.permissions_updated',
  'role.assigned': 'activity.role.assigned',
  'role.unassigned': 'activity.role.unassigned',
  'leave.created': 'activity.leave.created',
  'leave.deleted': 'activity.leave.deleted',
  'attendance.checked_in': 'activity.attendance.checked_in',
  'attendance.checked_out': 'activity.attendance.checked_out',
  'attendance.deleted': 'activity.attendance.deleted',
  'employee_request.created': 'activity.employee_request.created',
  'employee_request.status_updated': 'activity.employee_request.status_updated',
  'employee_request.deleted': 'activity.employee_request.deleted',
  'subscription_plan.created': 'activity.subscription_plan.created',
  'subscription_plan.updated': 'activity.subscription_plan.updated',
  'subscription_plan.deleted': 'activity.subscription_plan.deleted',
  'subscription_plan.activated': 'activity.subscription_plan.activated',
  'subscription_plan.deactivated': 'activity.subscription_plan.deactivated',
  'subscription_plan.trial_added': 'activity.subscription_plan.trial_added',
  'subscription_plan.trial_activated': 'activity.subscription_plan.trial_activated',
  'subscription_plan.trial_deactivated': 'activity.subscription_plan.trial_deactivated',
  'subscription_plan.trial_deleted': 'activity.subscription_plan.trial_deleted',
  'subscription.created': 'activity.subscription.created',
  'subscription.updated': 'activity.subscription.updated',
  'subscription.status_updated': 'activity.subscription.status_updated',
  'subscriber.activated': 'activity.subscriber.activated',
  'subscriber.deactivated': 'activity.subscriber.deactivated',
  'admin.notification_sent': 'activity.admin.notification_sent',
  'organization.created': 'activity.organization.created',
};

function humanizeActionKey(action: string): string {
  return action
    .split('.')
    .join(' ')
    .split('_')
    .join(' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function activityActionTitle(
  log: ActivityLogItemLike,
  t: (key: string) => string,
): string {
  const action = (log.action || '').toLowerCase();
  const titleKey = ACTION_TITLE_MAP[action];
  if (titleKey) {
    const translated = t(titleKey);
    if (translated && translated !== titleKey) return translated;
  }
  if (log.description) return log.description;
  if (log.action) return t(humanizeActionKey(log.action));
  return t('Activity');
}

// Backend stores snake_case (created_at); mobile types use camelCase.
// Accept both, like the web does (log.created_at || log.timeAgo).
export function activityLogDate(log: { createdAt?: string; created_at?: string }): string | undefined {
  return log.createdAt || log.created_at;
}

export type ActivityLog = {
  _id: string;
  action: string;
  description?: string;
  type?: string;
  createdAt?: string;
  created_at?: string;
  employee?: { _id: string; name: string; avatar?: string };
  department?: { _id: string; name: string };
  task?: { _id: string; title?: string };
  project?: { _id: string; name?: string };
};

export type ActivityLogsListParams = {
  page?: number;
  limit?: number;
  search?: string;
};

export async function fetchMyOrganizationLogs(params: ActivityLogsListParams = {}): Promise<{ data: ActivityLog[]; total: number }> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v != null) qs.append(k, String(v)); });
  const res = await http.get<ApiResponse<{ data: ActivityLog[]; total: number }>>(`/api/activity-logs/my-organization?${qs}`);
  return res.data.data;
}

export async function fetchMyLogs(params: ActivityLogsListParams = {}): Promise<{ data: ActivityLog[]; total: number }> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v != null) qs.append(k, String(v)); });
  const res = await http.get<ApiResponse<{ data: ActivityLog[]; total: number }>>(`/api/activity-logs/my-logs?${qs}`);
  return res.data.data;
}

export async function fetchAllLogs(params: ActivityLogsListParams = {}): Promise<{ data: ActivityLog[]; total: number }> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v != null) qs.append(k, String(v)); });
  const res = await http.get<ApiResponse<{ data: ActivityLog[]; total: number }>>(`/api/activity-logs?${qs}`);
  return res.data.data;
}

export async function fetchLogsByDepartment(departmentId: string, params: ActivityLogsListParams = {}): Promise<{ data: ActivityLog[]; total: number }> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v != null) qs.append(k, String(v)); });
  const res = await http.get<ApiResponse<{ data: ActivityLog[]; total: number }>>(`/api/activity-logs/department/${departmentId}?${qs}`);
  return res.data.data;
}

export async function fetchLogsByEmployee(employeeId: string, params: ActivityLogsListParams = {}): Promise<{ data: ActivityLog[]; total: number }> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v != null) qs.append(k, String(v)); });
  const res = await http.get<ApiResponse<{ data: ActivityLog[]; total: number }>>(`/api/activity-logs/employee/${employeeId}?${qs}`);
  return res.data.data;
}
