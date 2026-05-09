import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authApi, LoginParams, RegisterParams } from '@/api/auth';
import { User, UserRole } from '@/types';
import router from '@/router';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'));
  const user = ref<User | null>(null);

  const isAuthenticated = computed(() => !!token.value);
  const isProjectManager = computed(() => user.value?.role === UserRole.PROJECT_MANAGER);

  const initUser = async () => {
    if (token.value) {
      try {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          user.value = JSON.parse(savedUser);
        }
      } catch (error) {
        console.error('解析用户信息失败', error);
      }
    }
  };

  const login = async (params: LoginParams) => {
    const response = await authApi.login(params);
    token.value = response.token;
    user.value = response.user;
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    return response;
  };

  const register = async (params: RegisterParams) => {
    const response = await authApi.register(params);
    token.value = response.token;
    user.value = response.user;
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    return response;
  };

  const logout = () => {
    token.value = null;
    user.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return {
    token,
    user,
    isAuthenticated,
    isProjectManager,
    initUser,
    login,
    register,
    logout,
  };
});
