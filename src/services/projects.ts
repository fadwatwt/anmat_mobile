import { http } from '../lib/http';
import { ApiResponse } from '../types';

export type Project = {
  _id: string;
  name?: string;
  title?: string;
  description?: string;
  status?: string;
  progress?: number;
  start_date?: string;
  startDate?: string;
  due_date?: string;
  endDate?: string;
  department_id?: { name: string; _id: string };
  department?: { name: string; _id: string };
  assignees_ids?: string[];
  assignees?: { name: string; image?: string; _id: string }[];
  manager_id?: string;
  manager?: { _id: string; name: string; email?: string; avatar?: string };
  overall_rating?: number;
  attachments?: ProjectAttachment[];
  tasks?: any[];
  created_at?: string;
  updated_at?: string;
};

export type Department = {
  _id: string;
  name: string;
  rate?: number;
};

export type ActivityLog = {
  _id: string;
  action?: string;
  description?: string;
  createdAt?: string;
  user?: { name: string; image?: string };
};

export async function fetchProjects() {
  const response = await http.get<ApiResponse<Project[]>>('/api/subscriber/organization/projects');
  return response.data.data;
}

export async function fetchProjectDetails(id: string): Promise<Project> {
  const response = await http.get<ApiResponse<Project>>(`/api/subscriber/organization/projects/${id}`);
  return response.data.data ?? (response.data as any);
}

export type CreateProjectPayload = {
  name?: string;
  description?: string;
  manager_id?: string;
  department_id?: string;
  assignees_ids?: string[];
  start_date?: string;
  due_date?: string;
  started_in?: string;
  finished_in?: string;
  progress?: number;
  status?: string;
};

export async function createProject(payload: CreateProjectPayload): Promise<Project> {
  const response = await http.post<ApiResponse<Project>>('/api/subscriber/organization/projects', payload);
  return response.data.data ?? (response.data as any);
}

export async function updateProject(id: string, payload: Partial<CreateProjectPayload>): Promise<Project> {
  const response = await http.patch<ApiResponse<Project>>(`/api/subscriber/organization/projects/${id}`, payload);
  return response.data.data ?? (response.data as any);
}

export type ProjectEvaluation = {
  evaluation_method?: string;
  overall_rating?: number;
  evaluation_criteria?: Record<string, number>;
  comment?: string;
};

export async function evaluateProject(id: string, data: ProjectEvaluation): Promise<Project> {
  // Mirrors the web evaluateEmployeeProject (PATCH on the project).
  const response = await http.patch<ApiResponse<Project>>(`/api/subscriber/organization/projects/${id}`, data);
  return response.data.data ?? (response.data as any);
}

export async function deleteProject(id: string): Promise<void> {
  await http.delete(`/api/subscriber/organization/projects/${id}`);
}

// ===== Project comments (web: subscriberProjectsApi) =====
export type ProjectComment = {
  _id: string;
  text?: string;
  comment?: string;
  user?: { _id: string; name: string; avatar?: string };
  created_at?: string;
  createdAt?: string;
};

export async function fetchProjectComments(projectId: string): Promise<ProjectComment[]> {
  const response = await http.get<ApiResponse<ProjectComment[]>>(
    `/api/subscriber/organization/projects/${projectId}/comments`,
  );
  return response.data.data ?? response.data ?? [];
}

export async function addProjectComment(projectId: string, text: string): Promise<ProjectComment> {
  const response = await http.post<ApiResponse<ProjectComment>>(
    `/api/subscriber/organization/projects/${projectId}/comments`,
    { text },
  );
  return response.data.data ?? (response.data as any);
}

export async function updateProjectComment(projectId: string, commentId: string, text: string): Promise<ProjectComment> {
  const response = await http.put<ApiResponse<ProjectComment>>(
    `/api/subscriber/organization/projects/${projectId}/comments/${commentId}`,
    { text },
  );
  return response.data.data ?? (response.data as any);
}

export async function deleteProjectComment(projectId: string, commentId: string): Promise<void> {
  await http.delete(`/api/subscriber/organization/projects/${projectId}/comments/${commentId}`);
}

// ===== Project attachments (web: subscriberProjectsApi) =====
export type ProjectAttachment = {
  _id: string;
  file_name?: string;
  original_name?: string;
  url?: string;
  uploaded_by?: { _id: string; name: string };
  created_at?: string;
  createdAt?: string;
};

export async function uploadProjectAttachment(projectId: string, file: any): Promise<ProjectAttachment> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await http.post<ApiResponse<ProjectAttachment>>(
    `/api/subscriber/organization/projects/${projectId}/upload`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return response.data.data ?? (response.data as any);
}

export async function deleteProjectAttachment(projectId: string, attachmentId: string): Promise<void> {
  await http.delete(`/api/subscriber/organization/projects/${projectId}/upload/${attachmentId}`);
}

// ===== Project activity logs (web: subscriberProjectsApi) =====
export async function fetchProjectActivityLogs(projectId: string): Promise<ActivityLog[]> {
  const response = await http.get<ApiResponse<ActivityLog[]>>(
    `/api/subscriber/organization/projects/${projectId}/activity-logs`,
  );
  return response.data.data ?? response.data ?? [];
}

export async function fetchDepartments() {
  const response = await http.get<ApiResponse<Department[]>>('/api/subscriber/organization/departments');
  return response.data.data;
}

export async function fetchActivityLogs(limit = 10) {
  const response = await http.get<ApiResponse<ActivityLog[]>>('/api/activity-logs/my-organization', { params: { limit } });
  return response.data.data;
}

// ===== Employee "My Projects" (web: employeeProjectsApi, api/employee/projects) =====
export async function fetchMyProjects(): Promise<Project[]> {
  const response = await http.get<ApiResponse<Project[]> | Project[]>('/api/employee/projects');
  const data = (response.data as ApiResponse<Project[]>).data ?? response.data;
  return Array.isArray(data) ? data : [];
}

// ===== Project Templates =====
export type ProjectTemplate = {
  _id: string;
  name?: string;
  title?: string;
  description?: string;
  status?: string;
  tasks?: any[];
  stages?: any[];
  manager_id?: string;
  department_id?: string;
  assignees_ids?: string[];
  created_at?: string;
  updated_at?: string;
};

export async function fetchProjectTemplates(): Promise<ProjectTemplate[]> {
  const response = await http.get<ApiResponse<ProjectTemplate[]>>('/api/subscriber/organization/project-templates');
  return response.data.data || response.data || [];
}

export async function fetchProjectTemplateById(id: string): Promise<ProjectTemplate> {
  const response = await http.get<ApiResponse<ProjectTemplate>>(`/api/subscriber/organization/project-templates/${id}`);
  return response.data.data || (response.data as any);
}

export async function deleteProjectTemplate(id: string): Promise<void> {
  await http.delete(`/api/subscriber/organization/project-templates/${id}`);
}

export async function createProjectFromTemplate(templateId: string, data: any): Promise<Project> {
  const response = await http.post<ApiResponse<Project>>(`/api/subscriber/projects/from-template/${templateId}`, data);
  return response.data.data || (response.data as any);
}

// ===== Save an existing project as a template (web: SaveAsTemplateModal) =====
export type SaveAsTemplatePayload = {
  name: string;
  description?: string;
  category: string;
  estimated_duration?: number;
  department_id?: string;
};

export async function saveProjectAsTemplate(projectId: string, data: SaveAsTemplatePayload): Promise<ProjectTemplate> {
  const response = await http.post<ApiResponse<ProjectTemplate>>(
    `/api/subscriber/organization/project-templates/from-project/${projectId}`,
    data,
  );
  return response.data.data || (response.data as any);
}
