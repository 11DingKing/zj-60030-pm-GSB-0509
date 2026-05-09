<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <h2 style="text-align: center; margin: 0">项目任务管理系统</h2>
      </template>

      <el-tabs v-model="activeTab" style="margin-bottom: 20px">
        <el-tab-pane label="登录" name="login">
          <el-form :model="loginForm" :rules="loginRules" ref="loginFormRef" label-width="0">
            <el-form-item prop="email">
              <el-input
                v-model="loginForm.email"
                placeholder="邮箱"
                prefix-icon="User"
                size="large"
              />
            </el-form-item>
            <el-form-item prop="password">
              <el-input
                v-model="loginForm.password"
                type="password"
                placeholder="密码"
                prefix-icon="Lock"
                size="large"
                show-password
                @keyup.enter="handleLogin"
              />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                size="large"
                :loading="loading"
                @click="handleLogin"
                style="width: 100%"
              >
                登录
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="注册" name="register">
          <el-form
            :model="registerForm"
            :rules="registerRules"
            ref="registerFormRef"
            label-width="0"
          >
            <el-form-item prop="name">
              <el-input
                v-model="registerForm.name"
                placeholder="姓名"
                prefix-icon="User"
                size="large"
              />
            </el-form-item>
            <el-form-item prop="email">
              <el-input
                v-model="registerForm.email"
                placeholder="邮箱"
                prefix-icon="Message"
                size="large"
              />
            </el-form-item>
            <el-form-item prop="password">
              <el-input
                v-model="registerForm.password"
                type="password"
                placeholder="密码（至少6位）"
                prefix-icon="Lock"
                size="large"
                show-password
              />
            </el-form-item>
            <el-form-item prop="confirmPassword">
              <el-input
                v-model="registerForm.confirmPassword"
                type="password"
                placeholder="确认密码"
                prefix-icon="Lock"
                size="large"
                show-password
              />
            </el-form-item>
            <el-form-item prop="role">
              <el-select v-model="registerForm.role" placeholder="选择角色" size="large" style="width: 100%">
                <el-option label="开发成员" value="DEVELOPER" />
                <el-option label="项目经理" value="PROJECT_MANAGER" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                size="large"
                :loading="loading"
                @click="handleRegister"
                style="width: 100%"
              >
                注册
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>

      <div style="text-align: center; color: #909399; font-size: 12px">
        <p>项目经理账号: pm@example.com / 123456</p>
        <p>开发成员账号: dev1@example.com / 123456</p>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, FormInstance, FormRules } from 'element-plus';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const activeTab = ref('login');
const loading = ref(false);
const loginFormRef = ref<FormInstance>();
const registerFormRef = ref<FormInstance>();

const loginForm = reactive({
  email: '',
  password: '',
});

const registerForm = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'DEVELOPER' as 'DEVELOPER' | 'PROJECT_MANAGER',
});

const loginRules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' },
  ],
};

const registerRules: FormRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (_rule: any, value: string, callback: any) => {
        if (value !== registerForm.password) {
          callback(new Error('两次输入的密码不一致'));
        } else {
          callback();
        }
      },
      trigger: 'blur',
    },
  ],
};

const handleLogin = async () => {
  if (!loginFormRef.value) return;
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      try {
        await authStore.login(loginForm);
        ElMessage.success('登录成功');
        router.push('/projects');
      } catch (error) {
        console.error('登录失败', error);
      } finally {
        loading.value = false;
      }
    }
  });
};

const handleRegister = async () => {
  if (!registerFormRef.value) return;
  await registerFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      try {
        const { confirmPassword, ...params } = registerForm;
        await authStore.register(params);
        ElMessage.success('注册成功');
        router.push('/projects');
      } catch (error) {
        console.error('注册失败', error);
      } finally {
        loading.value = false;
      }
    }
  });
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 400px;
}
</style>
