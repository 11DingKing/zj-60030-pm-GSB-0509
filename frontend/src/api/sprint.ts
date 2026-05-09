import http from '@/utils/http';
import { Sprint, KanbanData } from '@/types';

export interface CreateSprintParams {
  name: string;
  goal?: string;
  startDate: string;
  endDate: string;
  status?: string;
  projectId: string;
}

export interface UpdateSprintParams {
  name?: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

export interface RetrospectiveData {
  sprint: {
    id: string;
    name: string;
    status: string;
    startDate: string;
    endDate: string;
  };
  storyPointsComparison: {
    planned: number;
    completed: number;
    completionRate: number;
  };
  memberStats: Array<{
    id: string;
    name: string;
    avatar?: string;
    completedTasks: number;
  }>;
  taskTypeDistribution: Array<{
    type: string;
    count: number;
  }>;
  totalTasks: number;
  completedTasks: number;
}

export const sprintApi = {
  getByProject: (projectId: string): Promise<Sprint[]> => {
    return http.get('/sprints', { params: { projectId } });
  },

  getById: (id: string): Promise<Sprint> => {
    return http.get(`/sprints/${id}`);
  },

  create: (data: CreateSprintParams): Promise<Sprint> => {
    return http.post('/sprints', data);
  },

  update: (id: string, data: UpdateSprintParams): Promise<Sprint> => {
    return http.put(`/sprints/${id}`, data);
  },

  delete: (id: string): Promise<void> => {
    return http.delete(`/sprints/${id}`);
  },

  getKanban: (id: string): Promise<KanbanData> => {
    return http.get(`/sprints/${id}/kanban`);
  },

  getRetrospective: (id: string): Promise<RetrospectiveData> => {
    return http.get(`/sprints/${id}/retrospective`);
  },
};
