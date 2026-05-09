<template>
  <div>
    <div style="margin-bottom: 20px">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-select
            v-model="selectedSprintId"
            placeholder="选择 Sprint 查看燃尽图"
            style="width: 100%"
            @change="handleSprintChange"
          >
            <el-option
              v-for="sprint in sprints"
              :key="sprint.id"
              :label="sprint.name"
              :value="sprint.id"
            />
          </el-select>
        </el-col>
      </el-row>
    </div>

    <div v-if="loading" style="text-align: center; padding: 40px">
      <i class="el-icon-loading" style="font-size: 24px"></i>
      <span style="margin-left: 8px">加载中...</span>
    </div>

    <div v-else>
      <el-row :gutter="20">
        <el-col :span="24">
          <el-card>
            <template #header>
              <span>燃尽图</span>
            </template>
            <div v-if="burnDownData" ref="burnDownChartRef" style="height: 400px"></div>
            <el-empty v-else description="请选择 Sprint 查看燃尽图" />
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" style="margin-top: 20px">
        <el-col :span="12">
          <el-card style="height: 100%">
            <template #header>
              <div style="display: flex; justify-content: space-between; align-items: center">
                <span>迭代速率趋势</span>
                <el-tag v-if="velocityData" type="info">
                  平均速率: {{ velocityData.averageVelocity.toFixed(1) }} 故事点/Sprint
                </el-tag>
              </div>
            </template>
            <div v-if="velocityData && velocityData.velocityData.length > 0" ref="velocityChartRef" style="height: 350px"></div>
            <el-empty v-else description="暂无数据" />
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card style="height: 100%">
            <template #header>
              <div style="display: flex; justify-content: space-between; align-items: center">
                <span>Bug 数量趋势</span>
                <el-tag v-if="bugTrendData" type="info">
                  近 {{ bugTrendData.sprintsCount }} 个 Sprint
                </el-tag>
              </div>
            </template>
            <div v-if="bugTrendData && bugTrendData.bugData.length > 0" ref="bugTrendChartRef" style="height: 350px"></div>
            <el-empty v-else description="暂无数据" />
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" style="margin-top: 20px">
        <el-col :span="24">
          <el-card>
            <template #header>
              <div style="display: flex; justify-content: space-between; align-items: center">
                <span>成员累计工时统计</span>
                <el-tag v-if="worklogData" type="info">
                  总工时: {{ worklogData.totalHours }} 小时
                </el-tag>
              </div>
            </template>
            <div v-if="worklogData && worklogData.memberWorklogs.length > 0" ref="worklogChartRef" style="height: 400px"></div>
            <el-empty v-else description="暂无数据" />
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import * as echarts from 'echarts';
import { statisticsApi, BurnDownData, VelocityData, WorklogData, BugTrendData } from '@/api/statistics';
import { sprintApi } from '@/api/sprint';
import { Sprint } from '@/types';
import dayjs from 'dayjs';

const route = useRoute();
const projectId = computed(() => route.params.id as string);

const loading = ref(true);
const error = ref<string | null>(null);
const sprints = ref<Sprint[]>([]);
const selectedSprintId = ref<string>('');

const burnDownData = ref<BurnDownData | null>(null);
const velocityData = ref<VelocityData | null>(null);
const worklogData = ref<WorklogData | null>(null);
const bugTrendData = ref<BugTrendData | null>(null);

const burnDownChartRef = ref<HTMLElement | null>(null);
const velocityChartRef = ref<HTMLElement | null>(null);
const worklogChartRef = ref<HTMLElement | null>(null);
const bugTrendChartRef = ref<HTMLElement | null>(null);

let burnDownChart: echarts.ECharts | null = null;
let velocityChart: echarts.ECharts | null = null;
let worklogChart: echarts.ECharts | null = null;
let bugTrendChart: echarts.ECharts | null = null;

const initBurnDownChart = () => {
  if (!burnDownChartRef.value || !burnDownData.value) {
    console.log('initBurnDownChart: skip, ref or data missing');
    return;
  }

  if (burnDownChart) {
    burnDownChart.dispose();
  }
  burnDownChart = echarts.init(burnDownChartRef.value);

  const dates = burnDownData.value.idealLine.map((d) => dayjs(d.date).format('MM-DD'));
  const idealValues = burnDownData.value.idealLine.map((d) => d.remaining);
  const actualValues = burnDownData.value.actualLine.map((d) => d.remaining);

  const option: echarts.EChartsOption = {
    title: {
      text: burnDownData.value.sprint.name,
      left: 'center',
      textStyle: {
        fontSize: 14,
        color: '#303133',
      },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
      },
    },
    legend: {
      data: ['理想线', '实际线'],
      top: 30,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: 80,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisLabel: {
        rotate: 45,
        interval: 0,
      },
    },
    yAxis: {
      type: 'value',
      name: '剩余故事点',
      minInterval: 1,
    },
    series: [
      {
        name: '理想线',
        type: 'line',
        data: idealValues,
        smooth: true,
        lineStyle: {
          color: '#909399',
          type: 'dashed',
        },
        itemStyle: {
          color: '#909399',
        },
      },
      {
        name: '实际线',
        type: 'line',
        data: actualValues,
        smooth: true,
        lineStyle: {
          color: '#409eff',
          width: 2,
        },
        itemStyle: {
          color: '#409eff',
        },
      },
    ],
  };

  burnDownChart.setOption(option);
};

const initVelocityChart = () => {
  if (!velocityChartRef.value || !velocityData.value || velocityData.value.velocityData.length === 0) {
    console.log('initVelocityChart: skip, ref or data missing');
    return;
  }

  if (velocityChart) {
    velocityChart.dispose();
  }
  velocityChart = echarts.init(velocityChartRef.value);

  const sprintNames = velocityData.value.velocityData.map((d) => d.sprintName);
  const completedPoints = velocityData.value.velocityData.map((d) => d.completedPoints);
  const plannedPoints = velocityData.value.velocityData.map((d) => d.plannedPoints);

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    legend: {
      data: ['完成故事点', '计划故事点'],
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: sprintNames,
    },
    yAxis: {
      type: 'value',
      name: '故事点',
      minInterval: 1,
    },
    series: [
      {
        name: '完成故事点',
        type: 'bar',
        data: completedPoints,
        itemStyle: {
          color: '#67c23a',
        },
        label: {
          show: true,
          position: 'top',
        },
      },
      {
        name: '计划故事点',
        type: 'bar',
        data: plannedPoints,
        itemStyle: {
          color: '#c0c4cc',
        },
        label: {
          show: true,
          position: 'top',
        },
      },
    ],
  };

  velocityChart.setOption(option);
};

const initWorklogChart = () => {
  if (!worklogChartRef.value || !worklogData.value || worklogData.value.memberWorklogs.length === 0) {
    console.log('initWorklogChart: skip, ref or data missing');
    return;
  }

  if (worklogChart) {
    worklogChart.dispose();
  }
  worklogChart = echarts.init(worklogChartRef.value);

  const memberNames = worklogData.value.memberWorklogs.map((m) => m.name);
  const totalHours = worklogData.value.memberWorklogs.map((m) => m.totalHours);

  const colors = ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399', '#06b6d4'];

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      formatter: '{b}: {c} 小时',
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      name: '工时（小时）',
      minInterval: 1,
    },
    yAxis: {
      type: 'category',
      data: memberNames,
    },
    series: [
      {
        name: '工时',
        type: 'bar',
        data: totalHours.map((value, index) => ({
          value,
          itemStyle: {
            color: colors[index % colors.length],
          },
        })),
        label: {
          show: true,
          position: 'right',
          formatter: '{c} 小时',
        },
        barWidth: '60%',
      },
    ],
  };

  worklogChart.setOption(option);
};

const initBugTrendChart = () => {
  if (!bugTrendChartRef.value || !bugTrendData.value || bugTrendData.value.bugData.length === 0) {
    console.log('initBugTrendChart: skip, ref or data missing');
    return;
  }

  if (bugTrendChart) {
    bugTrendChart.dispose();
  }
  bugTrendChart = echarts.init(bugTrendChartRef.value);

  const sprintNames = bugTrendData.value.bugData.map((d) => d.sprintName);
  const totalBugs = bugTrendData.value.bugData.map((d) => d.totalBugs);
  const resolvedBugs = bugTrendData.value.bugData.map((d) => d.resolvedBugs);
  const unresolvedBugs = bugTrendData.value.bugData.map((d) => d.unresolvedBugs);

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['总 Bug', '已解决', '未解决'],
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: sprintNames,
    },
    yAxis: {
      type: 'value',
      name: 'Bug 数量',
      minInterval: 1,
    },
    series: [
      {
        name: '总 Bug',
        type: 'line',
        data: totalBugs,
        smooth: true,
        lineStyle: {
          color: '#909399',
          width: 2,
        },
        itemStyle: {
          color: '#909399',
        },
      },
      {
        name: '已解决',
        type: 'line',
        data: resolvedBugs,
        smooth: true,
        lineStyle: {
          color: '#67c23a',
          width: 2,
        },
        itemStyle: {
          color: '#67c23a',
        },
      },
      {
        name: '未解决',
        type: 'line',
        data: unresolvedBugs,
        smooth: true,
        lineStyle: {
          color: '#f56c6c',
          width: 2,
        },
        itemStyle: {
          color: '#f56c6c',
        },
      },
    ],
  };

  bugTrendChart.setOption(option);
};

const handleResize = () => {
  burnDownChart?.resize();
  velocityChart?.resize();
  worklogChart?.resize();
  bugTrendChart?.resize();
};

const loadSprints = async () => {
  try {
    console.log('加载 Sprint 列表...');
    sprints.value = await sprintApi.getByProject(projectId.value);
    console.log('Sprint 列表:', sprints.value);
    if (sprints.value.length > 0) {
      selectedSprintId.value = sprints.value[sprints.value.length - 1].id;
    }
  } catch (err) {
    console.error('加载 Sprint 列表失败', err);
    ElMessage.error('加载 Sprint 列表失败');
  }
};

const loadBurnDown = async () => {
  if (!selectedSprintId.value) {
    burnDownData.value = null;
    return;
  }
  try {
    console.log('加载燃尽图数据... sprintId:', selectedSprintId.value);
    burnDownData.value = await statisticsApi.getBurnDown(selectedSprintId.value);
    console.log('燃尽图数据:', burnDownData.value);
    await nextTick();
    initBurnDownChart();
  } catch (err) {
    console.error('加载燃尽图数据失败', err);
    ElMessage.error('加载燃尽图数据失败');
  }
};

const loadVelocity = async () => {
  try {
    console.log('加载速率趋势数据...');
    velocityData.value = await statisticsApi.getVelocity(projectId.value);
    console.log('速率趋势数据:', velocityData.value);
    await nextTick();
    initVelocityChart();
  } catch (err) {
    console.error('加载速率趋势数据失败', err);
    ElMessage.error('加载速率趋势数据失败');
  }
};

const loadWorklog = async () => {
  try {
    console.log('加载工时数据...');
    worklogData.value = await statisticsApi.getWorklog(projectId.value);
    console.log('工时数据:', worklogData.value);
    await nextTick();
    initWorklogChart();
  } catch (err) {
    console.error('加载工时数据失败', err);
    ElMessage.error('加载工时数据失败');
  }
};

const loadBugTrend = async () => {
  try {
    console.log('加载 Bug 趋势数据...');
    bugTrendData.value = await statisticsApi.getBugTrend(projectId.value);
    console.log('Bug 趋势数据:', bugTrendData.value);
    await nextTick();
    initBugTrendChart();
  } catch (err) {
    console.error('加载 Bug 趋势数据失败', err);
    ElMessage.error('加载 Bug 趋势数据失败');
  }
};

const handleSprintChange = () => {
  console.log('Sprint 改变:', selectedSprintId.value);
  loadBurnDown();
};

const loadAllData = async () => {
  loading.value = true;
  error.value = null;
  try {
    console.log('开始加载统计数据... projectId:', projectId.value);
    await loadSprints();
    await Promise.all([
      loadVelocity(),
      loadWorklog(),
      loadBugTrend(),
    ]);
    window.addEventListener('resize', handleResize);
  } catch (err) {
    console.error('加载统计数据失败', err);
    error.value = '加载数据失败，请检查网络连接';
    ElMessage.error('加载统计数据失败');
  } finally {
    loading.value = false;
  }
};

watch(selectedSprintId, () => {
  loadBurnDown();
});

onMounted(() => {
  loadAllData();
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  burnDownChart?.dispose();
  velocityChart?.dispose();
  worklogChart?.dispose();
  bugTrendChart?.dispose();
});
</script>
