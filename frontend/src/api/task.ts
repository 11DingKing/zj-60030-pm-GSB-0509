import http from '@/utils/http';
import { Task, TaskStatus } from '@/types';

export interface CreateTaskParams {
  title: string;
  description?: string;
  priority?: string;
  type?: string;
  storyPoints?: number;
  status?: string;
  dueDate?: string;
  assigneeId?: string;
  sprintId?: string;
  projectId: string;
}

export interface UpdateTaskParams {
  title?: string;
  description?: string;
  priority?: string;
  type?: string;
  storyPoints?: number;
  status?: string;
  dueDate?: string;
  assigneeId?: string;
  sprintId?: string;
}

export interface QueryTasksParams {
  projectId?: string;
  sprintId?: string;
  status?: string;
  priority?: string;
  type?: string;
  assigneeId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const taskApi = {
  getAll: (params?: QueryTasksParams): Promise<Task[]> => {
    return http.get('/tasks', { params });
  },

  getById: (id: string): Promise<Task> => {
    return http.get(`/tasks/${id}`);
  },

  create: (data: CreateTaskParams): Promise<Task> => {
    return http.post('/tasks', data);
  },

  update: (id: string, data: UpdateTaskParams): Promise<Task> => {
    return http.put(`/tasks/${id}`, data);
  },

  updateStatus: (id: string, status: TaskStatus): Promise<Task> => {
    return http.put(`/tasks/${id}/status`, { status });
  },

  delete: (id: string): Promise<void> => {
    return http.delete(`/tasks/${id}`);
  },
};
