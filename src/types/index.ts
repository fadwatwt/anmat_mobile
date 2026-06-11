export type UserType = 'Admin' | 'Subscriber' | 'Employee';

export type ApiResponse<T> = {
  status: 'success' | 'failed';
  message: string;
  data: T;
  statusCode?: number;
};

export type User = {
  _id: string;
  name?: string;
  email: string;
  type: UserType;
  phone?: string;
  avatar?: string;
  is_organization_registered?: boolean;
};

export type LoginData = {
  access_token: string;
  user: User;
};

// ===== HR Types =====

export type EmployeeItem = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  department?: Department;
  position?: Position;
  employee_id?: string;
  hire_date?: string;
  status?: 'active' | 'inactive' | 'terminated' | 'on_leave';
  employment_type?: 'full_time' | 'part_time' | 'contract' | 'intern';
  salary?: number;
  manager?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Department = {
  _id: string;
  name: string;
  description?: string;
  manager?: string;
  employees_count?: number;
  createdAt?: string;
};

export type Position = {
  _id: string;
  name: string;
  description?: string;
  department?: string;
  level?: string;
  min_salary?: number;
  max_salary?: number;
  createdAt?: string;
};

export type EmployeeRequest = {
  _id: string;
  employee?: EmployeeItem;
  type: 'day_off' | 'salary_advance' | 'work_delay' | 'other';
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  start_date?: string;
  end_date?: string;
  reason?: string;
  amount?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type AttendanceRecord = {
  _id: string;
  employee?: EmployeeItem;
  date: string;
  check_in?: string;
  check_out?: string;
  status: 'present' | 'absent' | 'late' | 'early_leave' | 'on_leave';
  notes?: string;
  createdAt?: string;
};

export type LeaveRecord = {
  _id: string;
  employee?: EmployeeItem;
  type: 'annual' | 'sick' | 'emergency' | 'maternity' | 'paternity' | 'unpaid' | 'other';
  start_date: string;
  end_date: string;
  days_count?: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reason?: string;
  notes?: string;
  createdAt?: string;
};

export type SalaryTransaction = {
  _id: string;
  employee?: EmployeeItem;
  type: 'salary' | 'bonus' | 'deduction' | 'advance' | 'overtime' | 'allowance';
  amount: number;
  month: string;
  year: number;
  status: 'pending' | 'paid' | 'cancelled';
  description?: string;
  paid_date?: string;
  createdAt?: string;
};

export type TaskItem = {
  _id: string;
  title?: string;
  name?: string;
  description?: string;
  status?: string;
  priority?: string;
  start_date?: string;
  due_date?: string;
  end_date?: string;
  progress?: number;
  is_template?: boolean;
  project_id?: string;
  project?: { _id: string; name: string };
  department_id?: string;
  department?: { _id: string; name: string };
  assignee_id?: string;
  assignee?: { _id: string; name: string; email?: string; avatar?: string };
  creator?: { _id: string; name: string; email?: string };
  ratings?: Array<{ rate_time?: number; rate_content?: number; rate_video?: number; comment?: string }>;
  rate?: number;
  stages?: any[];
  comments?: any[];
  created_by?: string;
  appointment_id?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type AttendanceItem = {
  _id: string;
  check_in?: string;
  check_out?: string;
  date?: string;
  status?: string;
  createdAt?: string;
};

// ===== Dashboard Types =====

export type AnalyticsOverview = {
  total_tasks?: number;
  total_projects?: number;
  total_departments?: number;
  total_employees?: number;
};

export type TaskStatusCount = {
  _id: string;
  count: number;
};

export type TaskStatistics = {
  total: number;
  status_counts: Record<string, number>;
};

export type DepartmentRating = {
  _id: string;
  name: string;
  rate?: number;
  employees_count?: number;
};

export type DashboardProject = {
  _id: string;
  name?: string;
  title?: string;
  status?: string;
  progress?: number;
  department?: { _id: string; name: string };
  assigned_to?: Array<{ _id: string; name: string; avatar?: string }>;
  due_date?: string;
  start_date?: string;
};

export type ActivityLogItem = {
  _id: string;
  action?: string;
  description?: string;
  type?: string;
  createdAt?: string;
  employee?: { _id: string; name: string; avatar?: string };
};

export type AdminAnalytics = {
  totalCompanies: number;
  totalProjects: number;
  totalTasks: number;
  totalUsers: number;
  industriesChart?: Array<{ name: string; organizations_count: number }>;
  companiesSubscriptionsMonthly?: Array<{ name: string; total: number }>;
};

export type SubscriptionBasic = {
  _id: string;
  subscriber: { _id: string; name: string; email: string };
  organization: { name: string; website?: string; email?: string; logo?: string };
  status: string;
  starts_at: string;
  expires_at: string;
};

export type EmployeeDashboardTask = {
  _id: string;
  title?: string;
  name?: string;
  description?: string;
  status?: string;
  priority?: string;
  due_date?: string;
  department?: { _id: string; name: string };
  assigned_to?: Array<{ _id: string; name: string; avatar?: string }>;
  project?: { _id: string; name: string };
};

export type IndustryCount = {
  _id: string;
  name: string;
  organizations_count: number;
};

// ===== Web-matching Employee Detail Types =====

export type EmployeeDetailItem = {
  _id: string;
  user_id: string;
  organization_id: string;
  user?: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    is_active: boolean;
    avatar?: string;
  };
  department?: { _id: string; name: string };
  department_id?: { _id: string; name: string } | string;
  position_id?: { _id: string; title: string } | string;
  roles_ids?: string[];
  salary: number;
  work_hours: number;
  shift_type?: 'HOURS' | 'FIXED_SHIFT';
  shift_start_time?: string;
  shift_end_time?: string;
  country: string;
  city: string;
  date_of_birth?: string;
  overall_rating: number;
  manual_rating?: number;
  yearly_day_offs: number;
  weekend_days?: string[];
  registration_status: 'complete' | 'registered' | 'pending';
  invitation_token?: string;
  storage_quota?: number;
  used_storage?: number;
  total_points?: number;
  createdAt: string;
  updatedAt: string;
};

export type InvitationData = {
  link: string;
  email: string;
  organization?: { _id: string; name: string };
};

export type NotificationType = {
  _id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
};
