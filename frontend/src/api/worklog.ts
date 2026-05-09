import http from '@/utils/http';
import { Worklog } from '@/types';

export interface CreateWorklogParams {
  taskId: string;
  workDate: string;
  hours: number;
  description?: string;
}

export const worklogApi = {
  getByTask: (taskId: string): Promise<Worklog[]> => {
    return http.get('/worklogs', { params: { taskId } });
  },

  getByUser: (): Promise<Worklog[]> => {
    return http.get('/worklogs');
  },

  create: (data: CreateWorklogParams): Promise<Worklog> => {
    return http.post('/worklogs', data);
  },

  delete: (id: string): Promise<void> => {
    return http.delete(`/worklogs/${id}`);
  },
};
