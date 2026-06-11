import { http } from '../lib/http';
import { ApiResponse } from '../types';

// ===== Analytics payload shapes (web-matching) =====

export type NamedValue = { name: string; value: number; color?: string };

export type MonthlyPerf = { name: string; [key: string]: number | string };

export type GaugeUsage = {
  current?: number;
  max?: number | string;
  currentBytes?: number;
  maxBytes?: number | string;
  percentage: number;
};

export type RankingRow = {
  _id?: string;
  name: string;
  rate?: number;
  tasks?: number;
  performance?: number;
  [key: string]: any;
};

export type ProjectProgress = {
  _id?: string;
  name?: string;
  title?: string;
  progress?: number;
  status?: string;
  department?: { name?: string } | string;
  due_date?: string;
};

export type TopEmployee = {
  _id?: string;
  name: string;
  avatar?: string;
  rate?: number;
  performance?: number;
  tasks?: number;
};

export type SubscriberAnalyticsData = {
  overview?: { totalTasks?: number; totalProjects?: number; totalEmployees?: number; totalDepartments?: number };
  tasksSummary?: NamedValue[];
  tasksRatingData?: NamedValue[];
  tasksPerformanceMonthly?: MonthlyPerf[];
  tasksTimelineMonthly?: MonthlyPerf[];
  projectsPerformanceMonthly?: MonthlyPerf[];
  projectTimelineMonthly?: MonthlyPerf[];
  projectsProgress?: ProjectProgress[];
  recentProjects?: ProjectProgress[];
  employeeAttendance?: NamedValue[];
  employeeAdherence?: NamedValue[];
  employeePerformanceWeeks?: Array<{ name?: string; rating?: number }>;
  accomplishmentMonthly?: MonthlyPerf[];
  tasksDelay?: { percentage: number; expectedHours: number; actualHours: number };
  topEmployees?: TopEmployee[];
  departmentAdherence?: NamedValue[];
  departmentPerformance?: NamedValue[];
  departmentsRanking?: RankingRow[];
  subscriptionUsage?: {
    employees: GaugeUsage;
    storage: GaugeUsage;
  };
};

export type EmployeeAnalyticsData = {
  tasksSummary?: NamedValue[];
  tasksRatingData?: NamedValue[];
  tasksPerformanceMonthly?: MonthlyPerf[];
  tasksTimelineMonthly?: MonthlyPerf[];
  projectsPerformanceMonthly?: MonthlyPerf[];
  projectTimelineMonthly?: MonthlyPerf[];
  projectsPerformance?: ProjectProgress[];
  recentProjects?: ProjectProgress[];
};

export type AdminAnalyticsData = {
  totalCompanies?: number;
  totalUsers?: number;
  industriesChart?: NamedValue[];
  companiesSubscriptionsMonthly?: MonthlyPerf[];
  projectsPerformanceMonthly?: MonthlyPerf[];
  projectTimelineMonthly?: MonthlyPerf[];
  topCompanies?: Array<{ _id?: string; name: string; value?: number }>;
  lastProjects?: ProjectProgress[];
  companiesContacted?: MonthlyPerf[];
  revenuesMonthly?: MonthlyPerf[];
};

export async function fetchAdminAnalyticsFull(): Promise<AdminAnalyticsData> {
  const res = await http.get<ApiResponse<AdminAnalyticsData>>('/api/admin/analytics');
  return res.data.data || {};
}

export async function fetchSubscriberAnalyticsFull(): Promise<SubscriberAnalyticsData> {
  const res = await http.get<ApiResponse<SubscriberAnalyticsData>>('/api/subscriber/organization/analytics');
  return res.data.data || {};
}

export async function fetchEmployeeAnalyticsFull(): Promise<EmployeeAnalyticsData> {
  const res = await http.get<ApiResponse<EmployeeAnalyticsData>>('/api/employee/analytics');
  return res.data.data || {};
}
