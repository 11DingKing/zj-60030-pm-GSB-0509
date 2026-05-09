<template>
  <div>
    <el-card style="margin-bottom: 20px">
      <el-form :inline="true" :model="queryForm">
        <el-form-item label="Sprint">
          <el-select v-model="queryForm.sprintId" placeholder="全部 Sprint" clearable style="width: 200px">
            <el-option
              v-for="sprint in sprints"
              :key="sprint.id"
              :label="sprint.name"
              :value="sprint.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryForm.status" placeholder="全部状态" clearable style="width: 120px">
            <el-option label="待办" value="TODO" />
            <el-option label="进行中" value="IN_PROGRESS" />
            <el-option label="测试中" value="TESTING" />
            <el-option label="已完成" value="DONE" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="queryForm.priority" placeholder="全部优先级" clearable style="width: 100px">
            <el-option label="紧急" value="URGENT" />
            <el-option label="高" value="HIGH" />
            <el-option label="中" value="MEDIUM" />
            <el-option label="低" value="LOW" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="queryForm.type" placeholder="全部类型" clearable style="width: 120px">
            <el-option label="需求" value="REQUIREMENT" />
            <el-option label="Bug" value="BUG" />
            <el-option label="优化" value="OPTIMIZATION" />
            <el-option label="技术债务" value="TECH_DEBT" />
          </el-select>
        </el-form-item>
        <el-form-item label="指派人">
          <el-select v-model="queryForm.assigneeId" placeholder="全部成员" clearable filterable style="width: 120px">
            <el-option
              v-for="member in projectMembers"
              :key="member.id"
              :label="member.name"
              :value="member.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadTasks">搜索</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <el-table :data="tasks" v-loading="loading" style="width: 100%" @row-click="goToTask">
        <el-table-column prop="title" label="标题" min-width="200">
          <template #default="{ row }">
            <div style="cursor: pointer">
              <el-tag
                v-if="row.priority === 'URGENT'"
                type="danger"
                size="small"
                style="margin-right: 8px"
              >紧急</el-tag>
              <el-tag
                v-else-if="row.priority === 'HIGH'"
                type="warning"
                size="small"
                style="margin-right: 8px"
              >高</el-tag>
              <el-tag
                v-else-if="row.priority === 'MEDIUM'"
                type="primary"
                size="small"
                style="margin-right: 8px"
              >中</el-tag>
              <el-tag v-else type="info" size="small" style="margin-right: 8px">低</el-tag>
              {{ row.title }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)" size="small">
              {{ getTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="storyPoints" label="故事点" width="80" align="center" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="assignee" label="指派人" width="120">
          <template #default="{ row }">
            <div v-if="row.assignee" style="display: flex; align-items: center">
              <el-avatar :size="24" style="margin-right: 8px">
                {{ row.assignee.name?.charAt(0) }}
              </el-avatar>
              {{ row.assignee.name }}
            </div>
            <span v-else style="color: #909399">未分配</span>
          </template>
        </el-table-column>
        <el-table-column prop="dueDate" label="截止日期" width="120">
          <template #default="{ row }">
            <span :style="{ color: isOverdue(row.dueDate, row.status) ? '#f56c6c' : '' }">
              {{ formatDate(row.dueDate) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click.stop="goToTask(row.id)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import dayjs from 'dayjs';
import { taskApi, QueryTasksParams } from '@/api/task';
import { sprintApi } from '@/api/sprint';
import { projectApi } from '@/api/project';
import { Task, TaskStatus, TaskType, User, Sprint } from '@/types';

const route = useRoute();
const router = useRouter();
const projectId = computed(() => route.params.id as string);

const loading = ref(false);
const tasks = ref<Task[]>([]);
const sprints = ref<Sprint[]>([]);
const projectMembers = ref<User[]>([]);

const queryForm = reactive<QueryTasksParams>({
  projectId: '',
  sprintId: undefined,
  status: undefined,
  priority: undefined,
  type: undefined,
  assigneeId: undefined,
});

const formatDate = (date: string) => {
  return date ? dayjs(date).format('YYYY-MM-DD') : '-';
};

const isOverdue = (dueDate: string, status: TaskStatus) => {
  if (!dueDate || status === TaskStatus.DONE) return false;
  return dayjs(dueDate).isBefore(dayjs(), 'day');
};

const getTypeText = (type: TaskType) => {
  const texts: Record<string, string> = {
    REQUIREMENT: '需求',
    BUG: 'Bug',
    OPTIMIZATION: '优化',
    TECH_DEBT: '技术债务',
  };
  return texts[type] || type;
};

const getTypeTagType = (type: TaskType) => {
  const types: Record<string, string> = {
    REQUIREMENT: 'primary',
    BUG: 'danger',
    OPTIMIZATION: 'success',
    TECH_DEBT: 'warning',
  };
  return types[type] || 'info';
};

const getStatusText = (status: TaskStatus) => {
  const texts: Record<string, string> = {
    TODO: '待办',
    IN_PROGRESS: '进行中',
    TESTING: '测试中',
    DONE: '已完成',
  };
  return texts[status] || status;
};

const getStatusTagType = (status: TaskStatus) => {
  const types: Record<string, string> = {
    TODO: 'info',
    IN_PROGRESS: 'primary',
    TESTING: 'warning',
    DONE: 'success',
  };
  return types[status] || 'info';
};

const loadTasks = async () => {
  loading.value = true;
  try {
    const params = { ...queryForm, projectId: projectId.value };
    if (!params.sprintId) delete params.sprintId;
    if (!params.status) delete params.status;
    if (!params.priority) delete params.priority;
    if (!params.type) delete params.type;
    if (!params.assigneeId) delete params.assigneeId;
    tasks.value = await taskApi.getAll(params);
  } catch (error) {
    console.error('加载任务失败', error);
  } finally {
    loading.value = false;
  }
};

const loadSprints = async () => {
  try {
    sprints.value = await sprintApi.getByProject(projectId.value);
  } catch (error) {
    console.error('加载 Sprint 失败', error);
  }
};

const loadProjectMembers = async () => {
  try {
    const project = await projectApi.getById(projectId.value);
    projectMembers.value = project.members || [];
    if (project.owner) {
      projectMembers.value = [project.owner, ...projectMembers.value];
    }
  } catch (error) {
    console.error('加载项目成员失败', error);
  }
};

const resetQuery = () => {
  queryForm.sprintId = undefined;
  queryForm.status = undefined;
  queryForm.priority = undefined;
  queryForm.type = undefined;
  queryForm.assigneeId = undefined;
  loadTasks();
};

const goToTask = (taskOrId: Task | string) => {
  const taskId = typeof taskOrId === 'string' ? taskOrId : taskOrId.id;
  router.push(`/tasks/${taskId}`);
};

onMounted(() => {
  queryForm.projectId = projectId.value;
  loadTasks();
  loadSprints();
  loadProjectMembers();
});
</script>
