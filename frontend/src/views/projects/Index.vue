<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px">
      <h2>我的项目</h2>
      <el-button type="primary" @click="handleCreateProject" v-if="authStore.isProjectManager">
        <el-icon><Plus /></el-icon>
        新建项目
      </el-button>
    </div>

    <el-row :gutter="20">
      <el-col :span="8" v-for="project in projects" :key="project.id">
        <el-card
          shadow="hover"
          style="cursor: pointer"
          @click="goToProject(project)"
        >
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <span style="font-weight: bold; font-size: 16px">{{ project.name }}</span>
              <el-tag type="primary" size="small">
                {{ project._count?.tasks || 0 }} 任务
              </el-tag>
            </div>
          </template>
          <p style="color: #606266; margin-bottom: 15px; min-height: 40px">
            {{ project.description || '暂无描述' }}
          </p>
          <div style="display: flex; justify-content: space-between; font-size: 12px; color: #909399">
            <span>开始: {{ formatDate(project.startDate) }}</span>
            <span>结束: {{ formatDate(project.endDate) }}</span>
          </div>
          <div style="margin-top: 15px">
            <el-avatar-group>
              <el-avatar v-if="project.owner" :size="28" :key="project.owner.id">
                {{ project.owner.name?.charAt(0) }}
              </el-avatar>
              <el-avatar
                v-for="member in project.members?.slice(0, 3) || []"
                :size="28"
                :key="member.id"
              >
                {{ member.name?.charAt(0) }}
              </el-avatar>
              <el-avatar v-if="(project.members?.length || 0) > 3" :size="28">
                +{{ (project.members?.length || 0) - 3 }}
              </el-avatar>
            </el-avatar-group>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="createDialogVisible" title="新建项目" width="500px">
      <el-form :model="createForm" :rules="createRules" ref="createFormRef" label-width="100px">
        <el-form-item label="项目名称" prop="name">
          <el-input v-model="createForm.name" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="项目描述" prop="description">
          <el-input v-model="createForm.description" type="textarea" rows="3" placeholder="请输入项目描述" />
        </el-form-item>
        <el-form-item label="开始日期" prop="startDate">
          <el-date-picker
            v-model="createForm.startDate"
            type="date"
            placeholder="选择开始日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="结束日期" prop="endDate">
          <el-date-picker
            v-model="createForm.endDate"
            type="date"
            placeholder="选择结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="项目成员" prop="memberIds">
          <el-select
            v-model="createForm.memberIds"
            multiple
            filterable
            placeholder="请选择成员"
            style="width: 100%"
          >
            <el-option
              v-for="user in allUsers"
              :key="user.id"
              :label="user.name"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitCreateForm" :loading="creating">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, FormInstance, FormRules } from 'element-plus';
import dayjs from 'dayjs';
import { useAuthStore } from '@/stores/auth';
import { projectApi, CreateProjectParams } from '@/api/project';
import { userApi } from '@/api/user';
import { Project, User } from '@/types';
import { Plus } from '@element-plus/icons-vue';

const router = useRouter();
const authStore = useAuthStore();

const projects = ref<Project[]>([]);
const allUsers = ref<User[]>([]);
const createDialogVisible = ref(false);
const creating = ref(false);
const createFormRef = ref<FormInstance>();

const createForm = reactive<CreateProjectParams & { memberIds: string[] }>({
  name: '',
  description: '',
  startDate: '',
  endDate: '',
  memberIds: [],
});

const createRules: FormRules = {
  name: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
  startDate: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
  endDate: [{ required: true, message: '请选择结束日期', trigger: 'change' }],
};

const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD');
};

const loadProjects = async () => {
  try {
    projects.value = await projectApi.getAll();
  } catch (error) {
    console.error('加载项目失败', error);
  }
};

const loadUsers = async () => {
  try {
    allUsers.value = await userApi.getAll();
  } catch (error) {
    console.error('加载用户失败', error);
  }
};

const handleCreateProject = () => {
  createForm.name = '';
  createForm.description = '';
  createForm.startDate = '';
  createForm.endDate = '';
  createForm.memberIds = [];
  createDialogVisible.value = true;
};

const submitCreateForm = async () => {
  if (!createFormRef.value) return;
  await createFormRef.value.validate(async (valid) => {
    if (valid) {
      creating.value = true;
      try {
        await projectApi.create(createForm);
        ElMessage.success('创建成功');
        createDialogVisible.value = false;
        loadProjects();
      } catch (error) {
        console.error('创建失败', error);
      } finally {
        creating.value = false;
      }
    }
  });
};

const goToProject = (project: Project) => {
  localStorage.setItem(`project_${project.id}`, project.name);
  router.push(`/projects/${project.id}`);
};

onMounted(() => {
  loadProjects();
  if (authStore.isProjectManager) {
    loadUsers();
  }
});
</script>
