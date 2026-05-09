<template>
  <div v-loading="loading">
    <el-row :gutter="20">
      <el-col :span="16">
        <el-card>
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <h3 style="margin: 0">{{ task?.title }}</h3>
              <el-button type="primary" size="small" @click="handleEditTask">编辑</el-button>
            </div>
          </template>

          <div style="margin-bottom: 20px">
            <el-descriptions :column="4" border>
              <el-descriptions-item label="优先级">
                <el-tag :type="getPriorityTagType(task?.priority)" size="small">
                  {{ getPriorityText(task?.priority) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="类型">
                <el-tag :type="getTypeTagType(task?.type)" size="small">
                  {{ getTypeText(task?.type) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="故事点">
                {{ task?.storyPoints }}
              </el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :type="getStatusTagType(task?.status)" size="small">
                  {{ getStatusText(task?.status) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="指派人">
                <div v-if="task?.assignee" style="display: flex; align-items: center">
                  <el-avatar :size="24" style="margin-right: 8px">
                    {{ task.assignee.name?.charAt(0) }}
                  </el-avatar>
                  {{ task.assignee.name }}
                </div>
                <span v-else style="color: #909399">未分配</span>
              </el-descriptions-item>
              <el-descriptions-item label="创建人">
                <div v-if="task?.creator" style="display: flex; align-items: center">
                  <el-avatar :size="24" style="margin-right: 8px">
                    {{ task.creator.name?.charAt(0) }}
                  </el-avatar>
                  {{ task.creator.name }}
                </div>
              </el-descriptions-item>
              <el-descriptions-item label="截止日期">
                {{ formatDate(task?.dueDate) }}
              </el-descriptions-item>
              <el-descriptions-item label="创建时间">
                {{ formatDateTime(task?.createdAt) }}
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <div v-if="task?.description">
            <h4 style="margin-bottom: 12px">描述</h4>
            <el-card shadow="never" style="background-color: #f5f7fa">
              <p style="white-space: pre-wrap; margin: 0">{{ task.description }}</p>
            </el-card>
          </div>
        </el-card>

        <el-card style="margin-top: 20px">
          <template #header>
            <span>状态变更时间线</span>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="(log, index) in task?.statusLogs || []"
              :key="log.id"
              :timestamp="formatDateTime(log.changedAt)"
              placement="top"
              :type="getTimelineType(log.newStatus, index)"
            >
              <el-card shadow="never">
                <h4 style="margin: 0 0 8px 0">
                  <el-icon><EditPen /></el-icon>
                  {{ log.user?.name }}
                </h4>
                <p style="margin: 0; color: #606266">
                  状态变更:
                  <el-tag :type="getStatusTagType(log.oldStatus)" size="small" style="margin: 0 4px">
                    {{ getStatusText(log.oldStatus) }}
                  </el-tag>
                  <el-icon><ArrowRight /></el-icon>
                  <el-tag :type="getStatusTagType(log.newStatus)" size="small" style="margin: 0 4px">
                    {{ getStatusText(log.newStatus) }}
                  </el-tag>
                </p>
              </el-card>
            </el-timeline-item>
          </el-timeline>
          <el-empty v-if="!task?.statusLogs?.length" description="暂无状态变更记录" />
        </el-card>

        <el-card style="margin-top: 20px">
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <span>评论 ({{ task?.comments?.length || 0 }})</span>
            </div>
          </template>

          <el-form @submit.prevent="submitComment" style="margin-bottom: 20px">
            <el-input
              v-model="commentForm.content"
              type="textarea"
              :rows="3"
              placeholder="输入评论内容... (使用 @ 提及成员)"
            />
            <div style="margin-top: 10px; text-align: right">
              <el-button type="primary" @click="submitComment" :loading="submitting">
                发送评论
              </el-button>
            </div>
          </el-form>

          <div v-for="comment in task?.comments" :key="comment.id" class="comment-item">
            <div style="display: flex">
              <el-avatar :size="36" style="margin-right: 12px">
                {{ comment.author?.name?.charAt(0) }}
              </el-avatar>
              <div style="flex: 1">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px">
                  <span style="font-weight: 500">
                    {{ comment.author?.name }}
                    <el-tag v-if="comment.mentions?.length" type="info" size="small" style="margin-left: 8px">
                      @ {{ comment.mentions?.map(m => m.name).join(', ') }}
                    </el-tag>
                  </span>
                  <span style="color: #909399; font-size: 12px">
                    {{ formatDateTime(comment.createdAt) }}
                  </span>
                </div>
                <p style="margin: 0; color: #606266; white-space: pre-wrap">{{ comment.content }}</p>
              </div>
            </div>
          </div>
          <el-empty v-if="!task?.comments?.length" description="暂无评论" />
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card>
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <span>工时记录</span>
              <el-button type="primary" link size="small" @click="handleAddWorklog">
                添加工时
              </el-button>
            </div>
          </template>

          <div v-for="worklog in task?.worklogs" :key="worklog.id" class="worklog-item">
            <div style="display: flex; justify-content: space-between; align-items: center">
              <div style="display: flex; align-items: center">
                <el-avatar :size="24" style="margin-right: 8px">
                  {{ worklog.user?.name?.charAt(0) }}
                </el-avatar>
                <span>{{ worklog.user?.name }}</span>
              </div>
              <el-tag type="primary">{{ worklog.hours }} 小时</el-tag>
            </div>
            <p style="margin: 8px 0 0 0; font-size: 12px; color: #909399">
              {{ formatDate(worklog.workDate) }}
            </p>
            <p v-if="worklog.description" style="margin: 4px 0 0 0; font-size: 13px; color: #606266">
              {{ worklog.description }}
            </p>
          </div>
          <el-empty v-if="!task?.worklogs?.length" description="暂无工时记录" />
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="editDialogVisible" title="编辑任务" width="500px">
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="标题">
          <el-input v-model="editForm.title" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="editForm.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="editForm.priority" style="width: 100%">
            <el-option label="紧急" value="URGENT" />
            <el-option label="高" value="HIGH" />
            <el-option label="中" value="MEDIUM" />
            <el-option label="低" value="LOW" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="editForm.type" style="width: 100%">
            <el-option label="需求" value="REQUIREMENT" />
            <el-option label="Bug" value="BUG" />
            <el-option label="优化" value="OPTIMIZATION" />
            <el-option label="技术债务" value="TECH_DEBT" />
          </el-select>
        </el-form-item>
        <el-form-item label="故事点">
          <el-select v-model="editForm.storyPoints" style="width: 100%">
            <el-option :label="1" :value="1" />
            <el-option :label="2" :value="2" />
            <el-option :label="3" :value="3" />
            <el-option :label="5" :value="5" />
            <el-option :label="8" :value="8" />
            <el-option :label="13" :value="13" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="editForm.status" style="width: 100%">
            <el-option label="待办" value="TODO" />
            <el-option label="进行中" value="IN_PROGRESS" />
            <el-option label="测试中" value="TESTING" />
            <el-option label="已完成" value="DONE" />
          </el-select>
        </el-form-item>
        <el-form-item label="截止日期">
          <el-date-picker
            v-model="editForm.dueDate"
            type="date"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEditTask" :loading="editing">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="worklogDialogVisible" title="添加工时" width="400px">
      <el-form :model="worklogForm" label-width="80px">
        <el-form-item label="日期">
          <el-date-picker
            v-model="worklogForm.workDate"
            type="date"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="工时">
          <el-input-number v-model="worklogForm.hours" :min="0.5" :max="24" :step="0.5" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="worklogForm.description" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="worklogDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitWorklog" :loading="addingWorklog">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import dayjs from 'dayjs';
import { taskApi, UpdateTaskParams } from '@/api/task';
import { commentApi, CreateCommentParams } from '@/api/comment';
import { worklogApi, CreateWorklogParams } from '@/api/worklog';
import { Task, TaskPriority, TaskType, TaskStatus } from '@/types';
import { EditPen, ArrowRight } from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();
const taskId = computed(() => route.params.taskId as string);

const loading = ref(false);
const task = ref<Task | null>(null);

const editDialogVisible = ref(false);
const editing = ref(false);
const editForm = reactive<UpdateTaskParams>({});

const worklogDialogVisible = ref(false);
const addingWorklog = ref(false);
const worklogForm = reactive<CreateWorklogParams>({
  taskId: '',
  workDate: dayjs().format('YYYY-MM-DD'),
  hours: 1,
  description: '',
});

const submitting = ref(false);
const commentForm = reactive<CreateCommentParams>({
  content: '',
  taskId: '',
});

const formatDate = (date: string) => {
  return date ? dayjs(date).format('YYYY-MM-DD') : '-';
};

const formatDateTime = (date: string) => {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-';
};

const getPriorityText = (priority?: TaskPriority) => {
  const texts: Record<string, string> = {
    URGENT: '紧急',
    HIGH: '高',
    MEDIUM: '中',
    LOW: '低',
  };
  return texts[priority || ''] || priority;
};

const getPriorityTagType = (priority?: TaskPriority) => {
  const types: Record<string, string> = {
    URGENT: 'danger',
    HIGH: 'warning',
    MEDIUM: 'primary',
    LOW: 'info',
  };
  return types[priority || ''] || 'info';
};

const getTypeText = (type?: TaskType) => {
  const texts: Record<string, string> = {
    REQUIREMENT: '需求',
    BUG: 'Bug',
    OPTIMIZATION: '优化',
    TECH_DEBT: '技术债务',
  };
  return texts[type || ''] || type;
};

const getTypeTagType = (type?: TaskType) => {
  const types: Record<string, string> = {
    REQUIREMENT: 'primary',
    BUG: 'danger',
    OPTIMIZATION: 'success',
    TECH_DEBT: 'warning',
  };
  return types[type || ''] || 'info';
};

const getStatusText = (status?: TaskStatus) => {
  const texts: Record<string, string> = {
    TODO: '待办',
    IN_PROGRESS: '进行中',
    TESTING: '测试中',
    DONE: '已完成',
  };
  return texts[status || ''] || status;
};

const getStatusTagType = (status?: TaskStatus) => {
  const types: Record<string, string> = {
    TODO: 'info',
    IN_PROGRESS: 'primary',
    TESTING: 'warning',
    DONE: 'success',
  };
  return types[status || ''] || 'info';
};

const getTimelineType = (status: TaskStatus, _index: number) => {
  if (status === TaskStatus.DONE) return 'success';
  if (status === TaskStatus.IN_PROGRESS) return 'primary';
  if (status === TaskStatus.TESTING) return 'warning';
  return '';
};

const loadTask = async () => {
  loading.value = true;
  try {
    task.value = await taskApi.getById(taskId.value);
    commentForm.taskId = taskId.value;
    worklogForm.taskId = taskId.value;
  } catch (error) {
    console.error('加载任务失败', error);
  } finally {
    loading.value = false;
  }
};

const handleEditTask = () => {
  editForm.title = task.value?.title;
  editForm.description = task.value?.description;
  editForm.priority = task.value?.priority;
  editForm.type = task.value?.type;
  editForm.storyPoints = task.value?.storyPoints;
  editForm.status = task.value?.status;
  editForm.dueDate = task.value?.dueDate;
  editDialogVisible.value = true;
};

const submitEditTask = async () => {
  editing.value = true;
  try {
    await taskApi.update(taskId.value, editForm);
    ElMessage.success('更新成功');
    editDialogVisible.value = false;
    loadTask();
  } catch (error) {
    console.error('更新失败', error);
  } finally {
    editing.value = false;
  }
};

const handleAddWorklog = () => {
  worklogForm.workDate = dayjs().format('YYYY-MM-DD');
  worklogForm.hours = 1;
  worklogForm.description = '';
  worklogDialogVisible.value = true;
};

const submitWorklog = async () => {
  addingWorklog.value = true;
  try {
    await worklogApi.create(worklogForm);
    ElMessage.success('添加成功');
    worklogDialogVisible.value = false;
    loadTask();
  } catch (error) {
    console.error('添加失败', error);
  } finally {
    addingWorklog.value = false;
  }
};

const submitComment = async () => {
  if (!commentForm.content.trim()) {
    ElMessage.warning('请输入评论内容');
    return;
  }
  submitting.value = true;
  try {
    await commentApi.create(commentForm);
    ElMessage.success('评论成功');
    commentForm.content = '';
    loadTask();
  } catch (error) {
    console.error('评论失败', error);
  } finally {
    submitting.value = false;
  }
};

onMounted(() => {
  loadTask();
});
</script>
