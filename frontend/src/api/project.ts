import http from '@/utils/http';
import { Project } from '@/types';

export interface CreateProjectParams {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  memberIds?: string[];
}

export interface UpdateProjectParams {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  memberIds?: string[];
}

export interface DashboardData {
  project: {
    id: string;
    name: string;
    description?: string;
    startDate: string;
    endDate: string;
  };
  sprints: Array<{
    id: string;
    name: string;
    status: string;
    startDate: string;
    endDate: string;
    totalStoryPoints: number;
    completedStoryPoints: number;
    totalTasks: number;
    completedTasks: number;
  }>;
  upcomingTasks: any[];
  memberWorkloads: any[];
}

export const projectApi = {
  getAll: (): Promise<Project[]> => {
    return http.get('/projects');
  },

  getById: (id: string): Promise<Project> => {
    return http.get(`/projects/${id}`);
  },

  create: (data: CreateProjectParams): Promise<Project> => {
    return http.post('/projects', data);
  },

  update: (id: string, data: UpdateProjectParams): Promise<Project> => {
    return http.put(`/projects/${id}`, data);
  },

  delete: (id: string): Promise<void> => {
    return http.delete(`/projects/${id}`);
  },

  getDashboard: (id: string): Promise<DashboardData> => {
    return http.get(`/projects/${id}/dashboard`);
  },
};
