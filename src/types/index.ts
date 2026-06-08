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

export type TaskItem = {
  _id: string;
  title?: string;
  name?: string;
  description?: string;
  status?: string;
  priority?: string;
  due_date?: string;
  createdAt?: string;
};

export type AttendanceItem = {
  _id: string;
  check_in?: string;
  check_out?: string;
  date?: string;
  status?: string;
  createdAt?: string;
};

export type Analytics = Record<string, unknown>;
