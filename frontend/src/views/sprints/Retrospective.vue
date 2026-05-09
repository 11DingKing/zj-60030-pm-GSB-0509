<template>
  <div>
    <div style="margin-bottom: 20px">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="`/projects/${projectId}`">项目首页</el-breadcrumb-item>
        <el-breadcrumb-item>Sprint 回顾</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <div v-if="loading" style="text-align: center; padding: 40px">
      <i class="el-icon-loading" style="font-size: 24px"></i>
      <span style="margin-left: 8px">加载中...</span>
    </div>

    <div v-else-if="retrospective">
      <el-card style="margin-bottom: 20px">
        <template #header>
          <div style="display: flex; justify-content: space-between; align-items: center">
            <span>{{ retrospective.sprint.name }} - 回顾报告</span>
            <el-tag :type="getSprintStatusType(retrospective.sprint.status)">
              {{ getSprintStatusText(retrospective.sprint.status) }}
            </el-tag>
          </div>
        </template>
        <el-row :gutter="20">
          <el-col :span="6">
            <div style="text-align: center; padding: 20px">
              <div style="font-size: 32px; font-weight: bold; color: #409eff">
                {{ retrospective.storyPointsComparison.completed }}
              </div>
              <div style="color: #909399; margin-top: 8px">完成故事点</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div style="text-align: center; padding: 20px">
              <div style="font-size: 32px; font-weight: bold; color: #909399">
                {{ retrospective.storyPointsComparison.planned }}
              </div>
              <div style="color: #909399; margin-top: 8px">计划故事点</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div style="text-align: center; padding: 20px">
              <div style="font-size: 32px; font-weight: bold; color: #67c23a">
                {{ retrospective.storyPointsComparison.completionRate.toFixed(1) }}%
              </div>
              <div style="color: #909399; margin-top: 8px">完成率</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div style="text-align: center; padding: 20px">
              <div style="font-size: 32px; font-weight: bold; color: #e6a23c">
                {{ retrospective.completedTasks }}/{{ retrospective.totalTasks }}
              </div>
              <div style="color: #909399; margin-top: 8px">任务完成</div>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-card style="height: 100%">
            <template #header>
              <span>故事点对比</span>
            </template>
            <div ref="storyPointsChartRef" style="height: 300px"></div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card style="height: 100%">
            <template #header>
              <span>任务类型分布</span>
            </template>
            <div ref="taskTypeChartRef" style="height: 300px"></div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" style="margin-top: 20px">
        <el-col :span="24">
          <el-card>
            <template #header>
              <span>各成员完成任务统计</span>
            </template>
            <div ref="memberChartRef" style="height: 350px"></div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import * as echarts from 'echarts';
import { sprintApi, RetrospectiveData } from '@/api/sprint';
import { TaskType } from '@/types';

const route = useRoute();
const sprintId = computed(() => route.params.sprintId as string);
const projectId = ref<string>('');

const loading = ref(true);
const retrospective = ref<RetrospectiveData | null>(null);

const storyPointsChartRef = ref<HTMLElement | null>(null);
const taskTypeChartRef = ref<HTMLElement | null>(null);
const memberChartRef = ref<HTMLElement | null>(null);

let storyPointsChart: echarts.ECharts | null = null;
let taskTypeChart: echarts.ECharts | null = null;
let memberChart: echarts.ECharts | null = null;

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

const getTaskTypeText = (type: string) => {
  const texts: Record<string, string> = {
    [TaskType.REQUIREMENT]: '需求',
    [TaskType.BUG]: 'Bug',
    [TaskType.OPTIMIZATION]: '优化',
    [TaskType.TECH_DEBT]: '技术债务',
  };
  return texts[type] || type;
};

const getTaskTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    [TaskType.REQUIREMENT]: '#409eff',
    [TaskType.BUG]: '#f56c6c',
    [TaskType.OPTIMIZATION]: '#67c23a',
    [TaskType.TECH_DEBT]: '#e6a23c',
  };
  return colors[type] || '#909399';
};

const initStoryPointsChart = () => {
  if (!storyPointsChartRef.value || !retrospective.value) return;

  storyPointsChart = echarts.init(storyPointsChartRef.value);
  
  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    legend: {
      data: ['计划', '完成'],
    },
    xAxis: {
      type: 'category',
      data: ['故事点'],
    },
    yAxis: {
      type: 'value',
      name: '故事点',
    },
    series: [
      {
        name: '计划',
        type: 'bar',
        data: [retrospective.value.storyPointsComparison.planned],
        itemStyle: {
          color: '#909399',
        },
        label: {
          show: true,
          position: 'top',
        },
      },
      {
        name: '完成',
        type: 'bar',
        data: [retrospective.value.storyPointsComparison.completed],
        itemStyle: {
          color: '#67c23a',
        },
        label: {
          show: true,
          position: 'top',
        },
      },
    ],
  };

  storyPointsChart.setOption(option);
};

const initTaskTypeChart = () => {
  if (!taskTypeChartRef.value || !retrospective.value) return;

  taskTypeChart = echarts.init(taskTypeChartRef.value);

  const data = retrospective.value.taskTypeDistribution.map((item) => ({
    name: getTaskTypeText(item.type),
    value: item.count,
    itemStyle: {
      color: getTaskTypeColor(item.type),
    },
  }));

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      left: 'left',
    },
    series: [
      {
        name: '任务类型',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: true,
          formatter: '{b}: {c}',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
          },
        },
        labelLine: {
          show: true,
        },
        data,
      },
    ],
  };

  taskTypeChart.setOption(option);
};

const initMemberChart = () => {
  if (!memberChartRef.value || !retrospective.value) return;

  memberChart = echarts.init(memberChartRef.value);

  const memberNames = retrospective.value.memberStats.map((m) => m.name);
  const taskCounts = retrospective.value.memberStats.map((m) => m.completedTasks);

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    xAxis: {
      type: 'category',
      data: memberNames,
      axisLabel: {
        interval: 0,
        rotate: 0,
      },
    },
    yAxis: {
      type: 'value',
      name: '任务数',
      minInterval: 1,
    },
    series: [
      {
        name: '完成任务数',
        type: 'bar',
        data: taskCounts,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#409eff' },
            { offset: 1, color: '#66b1ff' },
          ]),
          borderRadius: [4, 4, 0, 0],
        },
        label: {
          show: true,
          position: 'top',
        },
      },
    ],
  };

  memberChart.setOption(option);
};

const handleResize = () => {
  storyPointsChart?.resize();
  taskTypeChart?.resize();
  memberChart?.resize();
};

const loadData = async () => {
  try {
    loading.value = true;
    retrospective.value = await sprintApi.getRetrospective(sprintId.value);
    await nextTick();
    initStoryPointsChart();
    initTaskTypeChart();
    initMemberChart();
    window.addEventListener('resize', handleResize);
  } catch (error) {
    console.error('加载回顾数据失败', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadData();
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  storyPointsChart?.dispose();
  taskTypeChart?.dispose();
  memberChart?.dispose();
});
</script>
