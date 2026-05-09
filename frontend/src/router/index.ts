import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', guest: true },
  },
  {
    path: '/',
    name: 'Layout',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    redirect: '/projects',
    children: [
      {
        path: 'projects',
        name: 'Projects',
        component: () => import('@/views/projects/Index.vue'),
        meta: { title: '项目列表' },
      },
      {
        path: 'projects/:id',
        name: 'ProjectDetail',
        component: () => import('@/views/projects/Dashboard.vue'),
        meta: { title: '项目首页' },
      },
      {
        path: 'projects/:id/kanban',
        name: 'Kanban',
        component: () => import('@/views/projects/Kanban.vue'),
        meta: { title: '看板视图' },
      },
      {
        path: 'projects/:id/list',
        name: 'TaskList',
        component: () => import('@/views/projects/TaskList.vue'),
        meta: { title: '列表视图' },
      },
      {
        path: 'projects/:id/statistics',
        name: 'Statistics',
        component: () => import('@/views/projects/Statistics.vue'),
        meta: { title: '统计报表' },
      },
      {
        path: 'sprints/:sprintId/retrospective',
        name: 'Retrospective',
        component: () => import('@/views/sprints/Retrospective.vue'),
        meta: { title: 'Sprint 回顾' },
      },
      {
        path: 'tasks/:taskId',
        name: 'TaskDetail',
        component: () => import('@/views/tasks/Detail.vue'),
        meta: { title: '任务详情' },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore();
  await authStore.initUser();

  document.title = to.meta.title ? `${to.meta.title} - 项目管理系统` : '项目管理系统';

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ path: '/login', query: { redirect: to.fullPath } });
  } else if (to.meta.guest && authStore.isAuthenticated) {
    next({ path: '/projects' });
  } else {
    next();
  }
});

export default router;
