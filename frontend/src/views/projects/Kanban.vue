<template>
  <div>
    <div
      style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      "
    >
      <el-select
        v-model="currentSprintId"
        placeholder="选择 Sprint"
        style="width: 300px"
        @change="loadKanban"
      >
        <el-option
          v-for="sprint in sprints"
          :key="sprint.id"
          :label="sprint.name"
          :value="sprint.id"
        />
      </el-select>
      <el-button type="primary" @click="handleCreateTask">
        <el-icon><Plus /></el-icon>
        新建任务
      </el-button>
    </div>

    <div v-loading="loading" class="kanban-container">
      <el-row :gutter="20">
        <el-col
          :span="6"
          v-for="column in kanbanData?.columns"
          :key="column.status"
        >
          <div
            :class="`kanban-column status-${column.status}`"
            :data-status="column.status"
            style="border-radius: 8px; padding: 16px"
          >
            <div
              style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 16px;
              "
            >
              <span style="font-weight: bold">
                {{ getStatusText(column.status) }}
                <el-tag
                  :type="getStatusType(column.status)"
                  size="small"
                  style="margin-left: 8px"
                >
                  {{ column.count }}
                </el-tag>
              </span>
            </div>

            <draggable
              :model-value="column.tasks"
              group="tasks"
              item-key="id"
              ghost-class="ghost"
              chosen-class="chosen"
              @end="onDragEnd($event, column.status)"
            >
              <template #item="{ element: task }">
                <el-card
                  class="task-card"
                  :class="`priority-${task.priority}`"
                  :data-id="task.id"
                  shadow="hover"
                  style="margin-bottom: 12px; cursor: grab"
                  @click.stop="goToTask(task.id)"
                >
                  <div style="font-weight: 500; margin-bottom: 8px">
                    {{ task.title }}
                  </div>
                  <div
                    style="
                      display: flex;
                      justify-content: space-between;
                      align-items: center;
                      font-size: 12px;
                    "
                  >
                    <div style="display: flex; gap: 4px">
                      <el-tag
                        :type="getPriorityType(task.priority)"
                        size="small"
                      >
                        {{ getPriorityText(task.priority) }}
                      </el-tag>
                      <el-tag size="small" type="info">
                        {{ task.storyPoints }} SP
                      </el-tag>
                    </div>
                    <el-avatar
                      v-if="task.assignee"
                      :size="20"
                      style="background-color: #409eff"
                    >
                      {{ task.assignee.name?.charAt(0) }}
                    </el-avatar>
                  </div>
                  <div
                    style="
                      margin-top: 8px;
                      display: flex;
                      gap: 8px;
                      font-size: 12px;
                      color: #909399;
                    "
                  >
                    <el-icon><ChatDotRound /></el-icon>
                    <span>{{ task._count?.comments || 0 }}</span>
                    <el-icon><Clock /></el-icon>
                    <span>{{ task._count?.worklogs || 0 }}</span>
                  </div>
                </el-card>
              </template>
            </draggable>
          </div>
        </el-col>
      </el-row>
    </div>

    <el-dialog v-model="taskDialogVisible" title="新建任务" width="600px">
      <el-form
        :model="taskForm"
        :rules="taskRules"
        ref="taskFormRef"
        label-width="100px"
      >
        <el-form-item label="标题" prop="title">
          <el-input v-model="taskForm.title" placeholder="请输入任务标题" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="taskForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入任务描述"
          />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="优先级" prop="priority">
              <el-select
                v-model="taskForm.priority"
                placeholder="选择优先级"
                style="width: 100%"
              >
                <el-option label="紧急" value="URGENT" />
                <el-option label="高" value="HIGH" />
                <el-option label="中" value="MEDIUM" />
                <el-option label="低" value="LOW" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="类型" prop="type">
              <el-select
                v-model="taskForm.type"
                placeholder="选择类型"
                style="width: 100%"
              >
                <el-option label="需求" value="REQUIREMENT" />
                <el-option label="Bug" value="BUG" />
                <el-option label="优化" value="OPTIMIZATION" />
                <el-option label="技术债务" value="TECH_DEBT" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="故事点" prop="storyPoints">
              <el-select
                v-model="taskForm.storyPoints"
                placeholder="选择故事点"
                style="width: 100%"
              >
                <el-option :label="1" :value="1" />
                <el-option :label="2" :value="2" />
                <el-option :label="3" :value="3" />
                <el-option :label="5" :value="5" />
                <el-option :label="8" :value="8" />
                <el-option :label="13" :value="13" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="指派人" prop="assigneeId">
              <el-select
                v-model="taskForm.assigneeId"
                placeholder="选择指派人"
                filterable
                style="width: 100%"
                clearable
              >
                <el-option
                  v-for="user in projectMembers"
                  :key="user.id"
                  :label="user.name"
                  :value="user.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="截止日期" prop="dueDate">
          <el-date-picker
            v-model="taskForm.dueDate"
            type="date"
            placeholder="选择截止日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="taskDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitTaskForm" :loading="submitting"
          >确定</el-button
        >
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, FormInstance, FormRules } from "element-plus";
import draggable from "vuedraggable";
import { sprintApi, KanbanData } from "@/api/sprint";
import { taskApi, CreateTaskParams } from "@/api/task";
import { projectApi } from "@/api/project";
import { Sprint, TaskStatus, User, TaskPriority, TaskType } from "@/types";
import { Plus, ChatDotRound, Clock } from "@element-plus/icons-vue";

const route = useRoute();
const router = useRouter();
const projectId = computed(() => route.params.id as string);

const loading = ref(false);
const submitting = ref(false);
const kanbanData = ref<KanbanData | null>(null);
const sprints = ref<Sprint[]>([]);
const currentSprintId = ref<string>("");
const projectMembers = ref<User[]>([]);

const taskDialogVisible = ref(false);
const taskFormRef = ref<FormInstance>();
const taskForm = reactive<CreateTaskParams>({
  title: "",
  description: "",
  priority: TaskPriority.MEDIUM,
  type: TaskType.REQUIREMENT,
  storyPoints: 3,
  status: TaskStatus.TODO,
  dueDate: "",
  assigneeId: undefined,
  sprintId: undefined,
  projectId: "",
});

const taskRules: FormRules = {
  title: [{ required: true, message: "请输入任务标题", trigger: "blur" }],
};

const getStatusText = (status: TaskStatus) => {
  const texts: Record<string, string> = {
    TODO: "待办",
    IN_PROGRESS: "进行中",
    TESTING: "测试中",
    DONE: "已完成",
  };
  return texts[status] || status;
};

const getStatusType = (status: TaskStatus) => {
  const types: Record<string, string> = {
    TODO: "info",
    IN_PROGRESS: "primary",
    TESTING: "warning",
    DONE: "success",
  };
  return types[status] || "info";
};

const getPriorityText = (priority: TaskPriority) => {
  const texts: Record<string, string> = {
    URGENT: "紧急",
    HIGH: "高",
    MEDIUM: "中",
    LOW: "低",
  };
  return texts[priority] || priority;
};

const getPriorityType = (priority: TaskPriority) => {
  const types: Record<string, string> = {
    URGENT: "danger",
    HIGH: "warning",
    MEDIUM: "primary",
    LOW: "info",
  };
  return types[priority] || "info";
};

const loadSprints = async () => {
  try {
    sprints.value = await sprintApi.getByProject(projectId.value);
    if (sprints.value.length > 0 && !currentSprintId.value) {
      const inProgress = sprints.value.find((s) => s.status === "IN_PROGRESS");
      currentSprintId.value = inProgress?.id || sprints.value[0].id;
      loadKanban();
    }
  } catch (error) {
    console.error("加载 Sprint 失败", error);
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
    console.error("加载项目成员失败", error);
  }
};

const loadKanban = async () => {
  if (!currentSprintId.value) return;
  loading.value = true;
  try {
    kanbanData.value = await sprintApi.getKanban(currentSprintId.value);
  } catch (error) {
    console.error("加载看板失败", error);
  } finally {
    loading.value = false;
  }
};

const onDragEnd = async (evt: any, newStatus: TaskStatus) => {
  if (!kanbanData.value || !evt?.item?.dataset) return;

  const draggedElement = evt.item;
  const taskId = draggedElement.getAttribute("data-id");

  if (!taskId) return;

  const oldStatus = evt.from.dataset.status;

  if (oldStatus === newStatus) return;

  try {
    await taskApi.updateStatus(taskId, newStatus);
    loadKanban();
    ElMessage.success("状态已更新");
  } catch (error) {
    console.error("更新状态失败", error);
    loadKanban();
  }
};

const handleCreateTask = () => {
  if (!currentSprintId.value) {
    ElMessage.warning("请先选择 Sprint");
    return;
  }
  taskForm.title = "";
  taskForm.description = "";
  taskForm.priority = TaskPriority.MEDIUM;
  taskForm.type = TaskType.REQUIREMENT;
  taskForm.storyPoints = 3;
  taskForm.status = TaskStatus.TODO;
  taskForm.dueDate = "";
  taskForm.assigneeId = undefined;
  taskForm.sprintId = currentSprintId.value;
  taskForm.projectId = projectId.value;
  taskDialogVisible.value = true;
};

const submitTaskForm = async () => {
  if (!taskFormRef.value) return;
  await taskFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true;
      try {
        await taskApi.create(taskForm);
        ElMessage.success("创建成功");
        taskDialogVisible.value = false;
        loadKanban();
      } catch (error) {
        console.error("创建失败", error);
      } finally {
        submitting.value = false;
      }
    }
  });
};

const goToTask = (taskId: string) => {
  router.push(`/tasks/${taskId}`);
};

onMounted(() => {
  loadSprints();
  loadProjectMembers();
});
</script>

<style scoped>
.kanban-container {
  min-height: calc(100vh - 200px);
}

.ghost {
  opacity: 0.5;
  background: #c8ebfb;
}

.chosen {
  opacity: 0.8;
}
</style>
