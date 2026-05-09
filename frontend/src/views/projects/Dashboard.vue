<template>
  <div>
    <div style="margin-bottom: 20px">
      <el-select
        v-model="currentSprintId"
        placeholder="选择 Sprint"
        style="width: 300px"
        @change="handleSprintChange"
      >
        <el-option
          v-for="sprint in sprints"
          :key="sprint.id"
          :label="sprint.name"
          :value="sprint.id"
        />
      </el-select>
    </div>

    <el-row :gutter="20" style="margin-bottom: 20px">
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="text-align: center">
            <div style="font-size: 24px; font-weight: bold; color: #409eff">
              {{ dashboard?.sprints?.length || 0 }}
            </div>
            <div style="color: #909399; margin-top: 8px">Sprint 数量</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="text-align: center">
            <div style="font-size: 24px; font-weight: bold; color: #67c23a">
              {{ totalTasks }}
            </div>
            <div style="color: #909399; margin-top: 8px">任务总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="text-align: center">
            <div style="font-size: 24px; font-weight: bold; color: #e6a23c">
              {{ completedTasks }}
            </div>
            <div style="color: #909399; margin-top: 8px">已完成任务</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="text-align: center">
            <div style="font-size: 24px; font-weight: bold; color: #f56c6c">
              {{ pendingTasks }}
            </div>
            <div style="color: #909399; margin-top: 8px">待处理任务</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="16">
        <el-card>
          <template #header>
            <span>Sprint 进度</span>
          </template>
          <div v-if="dashboard?.sprints">
            <div
              v-for="sprint in dashboard.sprints"
              :key="sprint.id"
              style="margin-bottom: 20px"
            >
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px">
                <span style="font-weight: 500">
                  {{ sprint.name }}
                  <el-tag :type="getSprintStatusType(sprint.status)" size="small" style="margin-left: 8px">
                    {{ getSprintStatusText(sprint.status) }}
                  </el-tag>
                </span>
                <span style="color: #909399; font-size: 12px">
                  故事点: {{ sprint.completedStoryPoints }}/{{ sprint.totalStoryPoints }}
                </span>
              </div>
              <el-progress
                :percentage="sprint.totalStoryPoints > 0
                  ? Math.round((sprint.completedStoryPoints / sprint.totalStoryPoints) * 100)
                  : 0"
                :format="() => `${sprint.completedTasks}/${sprint.totalTasks} 任务`"
              />
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card>
          <template #header>
            <span>本周到期任务</span>
          </template>
          <div v-if="dashboard?.upcomingTasks?.length > 0">
            <div
              v-for="task in dashboard.upcomingTasks"
              :key="task.id"
              style="padding: 12px 0; border-bottom: 1px solid #ebeef5; cursor: pointer"
              @click="goToTask(task.id)"
            >
              <div style="display: flex; justify-content: space-between; align-items: center">
                <span style="font-weight: 500">{{ task.title }}</span>
                <el-tag :type="getTaskStatusType(task.status)" size="small">
                  {{ getTaskStatusText(task.status) }}
                </el-tag>
              </div>
              <div style="margin-top: 4px; display: flex; justify-content: space-between; font-size: 12px; color: #909399">
                <span v-if="task.assignee">{{ task.assignee.name }}</span>
                <span>{{ formatDate(task.dueDate) }}</span>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无到期任务" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="24">
        <el-card>
          <template #header>
            <span>成员工作负载</span>
          </template>
          <el-table :data="dashboard?.memberWorkloads || []" style="width: 100%">
            <el-table-column prop="name" label="成员" width="200">
              <template #default="{ row }">
                <div style="display: flex; align-items: center">
                  <el-avatar :size="32" style="margin-right: 10px">
                    {{ row.name?.charAt(0) }}
                  </el-avatar>
                  {{ row.name }}
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="pendingTasks" label="待处理任务数" />
            <el-table-column prop="pendingStoryPoints" label="待处理故事点" />
            <el-table-column label="工作负载">
              <template #default="{ row }">
                <el-progress
                  :percentage="Math.min(row.pendingStoryPoints * 5, 100)"
                  :color="getWorkloadColor(row.pendingStoryPoints)"
                />
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import dayjs from 'dayjs';
import { projectApi, DashboardData } from '@/api/project';
import { Sprint, TaskStatus } from '@/types';

const route = useRoute();
const router = useRouter();
const projectId = computed(() => route.params.id as string);

const dashboard = ref<DashboardData | null>(null);
const sprints = ref<Sprint[]>([]);
const currentSprintId = ref<string>('');

const totalTasks = computed(() => {
  return dashboard?.sprints?.reduce((sum, s) => sum + s.totalTasks, 0) || 0;
});

const completedTasks = computed(() => {
  return dashboard?.sprints?.reduce((sum, s) => sum + s.completedTasks, 0) || 0;
});

const pendingTasks = computed(() => {
  return totalTasks.value - completedTasks.value;
});

const formatDate = (date: string) => {
  return dayjs(date).format('MM-DD');
};

const getSprintStatusType = (status: string) => {
  const types: Record<string, string> = {
    PLANNING: 'info',
    IN_PROGRESS: 'primary',
    COMPLETED: 'success',
  };
  return types[status] || 'info';
};

const getSprintStatusText = (status: string) => {
  const texts: Record<string, string> = {
    PLANNING: '规划中',
    IN_PROGRESS: '进行中',
    COMPLETED: '已完成',
  };
  return texts[status] || status;
};

const getTaskStatusType = (status: TaskStatus) => {
  const types: Record<string, string> = {
    TODO: 'info',
    IN_PROGRESS: 'primary',
    TESTING: 'warning',
    DONE: 'success',
  };
  return types[status] || 'info';
};

const getTaskStatusText = (status: TaskStatus) => {
  const texts: Record<string, string> = {
    TODO: '待办',
    IN_PROGRESS: '进行中',
    TESTING: '测试中',
    DONE: '已完成',
  };
  return texts[status] || status;
};

const getWorkloadColor = (points: number) => {
  if (points > 20) return '#f56c6c';
  if (points > 10) return '#e6a23c';
  return '#67c23a';
};

const loadDashboard = async () => {
  try {
    dashboard.value = await projectApi.getDashboard(projectId.value);
    if (dashboard.value?.project) {
      localStorage.setItem(`project_${projectId.value}`, dashboard.value.project.name);
    }
  } catch (error) {
    console.error('加载首页失败', error);
  }
};

const handleSprintChange = () => {
  if (currentSprintId.value) {
    router.push(`/projects/${projectId.value}/kanban`);
  }
};

const goToTask = (taskId: string) => {
  router.push(`/tasks/${taskId}`);
};

onMounted(() => {
  loadDashboard();
});
</script>
