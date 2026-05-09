<template>
  <el-container style="height: 100vh">
    <el-aside :width="isCollapse ? '64px' : '200px'" style="background-color: #304156">
      <div
        class="logo"
        style="
          height: 60px;
          line-height: 60px;
          text-align: center;
          color: #fff;
          font-size: 18px;
          font-weight: bold;
          background-color: #263445;
        "
      >
        <span v-if="!isCollapse">项目管理系统</span>
        <el-icon v-else><Document /></el-icon>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
        router
      >
        <el-menu-item index="/projects">
          <el-icon><Folder /></el-icon>
          <template #title>项目列表</template>
        </el-menu-item>

        <template v-if="currentProjectId">
          <el-sub-menu index="project">
            <template #title>
              <el-icon><Document /></el-icon>
              <span>{{ currentProjectName }}</span>
            </template>
            <el-menu-item :index="`/projects/${currentProjectId}`">
              <el-icon><DataAnalysis /></el-icon>
              <span>项目首页</span>
            </el-menu-item>
            <el-menu-item :index="`/projects/${currentProjectId}/kanban`">
              <el-icon><Menu /></el-icon>
              <span>看板视图</span>
            </el-menu-item>
            <el-menu-item :index="`/projects/${currentProjectId}/list`">
              <el-icon><List /></el-icon>
              <span>列表视图</span>
            </el-menu-item>
            <el-menu-item :index="`/projects/${currentProjectId}/statistics`">
              <el-icon><TrendCharts /></el-icon>
              <span>统计报表</span>
            </el-menu-item>
          </el-sub-menu>
        </template>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header
        style="
          padding: 0 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background-color: #fff;
          border-bottom: 1px solid #ebeef5;
        "
      >
        <div>
          <el-icon
            :size="20"
            style="cursor: pointer"
            @click="toggleCollapse"
          >
            <component :is="isCollapse ? 'Expand' : 'Fold'" />
          </el-icon>
        </div>

        <div style="display: flex; align-items: center; gap: 20px">
          <el-dropdown @command="handleCommand">
            <span style="display: flex; align-items: center; cursor: pointer">
              <el-avatar :size="32" style="margin-right: 8px">
                {{ authStore.user?.name?.charAt(0) }}
              </el-avatar>
              <span>{{ authStore.user?.name }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人信息</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main style="background-color: #f0f2f5; overflow-y: auto">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessageBox } from 'element-plus';
import { useAuthStore } from '@/stores/auth';
import {
  Document,
  Folder,
  DataAnalysis,
  Menu,
  List,
  TrendCharts,
  Expand,
  Fold,
  ArrowDown,
} from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const isCollapse = ref(false);
const activeMenu = ref(route.path);

const currentProjectId = computed(() => route.params.id as string);
const currentProjectName = computed(() => {
  const projectName = localStorage.getItem(`project_${currentProjectId.value}`);
  return projectName || '项目详情';
});

watch(
  () => route.path,
  (path) => {
    activeMenu.value = path;
  }
);

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value;
};

const handleCommand = (command: string) => {
  if (command === 'profile') {
    ElMessageBox.alert(
      `
        <div style="text-align: left; line-height: 1.8;">
          <p><strong>用户名：</strong>${authStore.user?.name || '-'}</p>
          <p><strong>邮箱：</strong>${authStore.user?.email || '-'}</p>
          <p><strong>角色：</strong>${authStore.user?.role === 'PROJECT_MANAGER' ? '项目经理' : '开发人员'}</p>
          <p><strong>创建时间：</strong>${authStore.user?.createdAt ? new Date(authStore.user.createdAt).toLocaleString() : '-'}</p>
        </div>
      `,
      '个人信息',
      {
        dangerouslyUseHTMLString: true,
        confirmButtonText: '确定',
      }
    ).catch(() => {});
  } else if (command === 'logout') {
    authStore.logout();
  }
};
</script>
