import http from '@/utils/http';
import { LoginResponse, User } from '@/types';

export interface LoginParams {
  email: string;
  password: string;
}

export interface RegisterParams {
  email: string;
  password: string;
  name: string;
  role?: 'PROJECT_MANAGER' | 'DEVELOPER';
  avatar?: string;
}

export const authApi = {
  login: (data: LoginParams): Promise<LoginResponse> => {
    return http.post('/auth/login', data);
  },

  register: (data: RegisterParams): Promise<LoginResponse> => {
    return http.post('/auth/register', data);
  },

  getProfile: (): Promise<User> => {
    return http.get('/auth/profile');
  },
};
