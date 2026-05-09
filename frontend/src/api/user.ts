import http from '@/utils/http';
import { User } from '@/types';

export const userApi = {
  getAll: (): Promise<User[]> => {
    return http.get('/users');
  },

  getById: (id: string): Promise<User> => {
    return http.get(`/users/${id}`);
  },
};
