<template>
  <router-view />
</template>

<script setup lang="ts">
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body,
#app {
  height: 100%;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', Arial, sans-serif;
}

.el-menu {
  border-right: none !important;
}

.el-card {
  margin-bottom: 20px;
}

.kanban-column {
  min-height: 500px;
}

.task-card {
  cursor: grab;
  transition: all 0.3s;
}

.task-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.task-card:active {
  cursor: grabbing;
}

.priority-URGENT {
  border-left: 4px solid #f56c6c !important;
}

.priority-HIGH {
  border-left: 4px solid #e6a23c !important;
}

.priority-MEDIUM {
  border-left: 4px solid #409eff !important;
}

.priority-LOW {
  border-left: 4px solid #909399 !important;
}

.status-TODO {
  background-color: #f4f4f5;
}

.status-IN_PROGRESS {
  background-color: #ecf5ff;
}

.status-TESTING {
  background-color: #fdf6ec;
}

.status-DONE {
  background-color: #f0f9eb;
}

.chart-container {
  width: 100%;
  height: 400px;
}

.avatar-sm {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #409eff;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.avatar-md {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #409eff;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.avatar-lg {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: #409eff;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.comment-item {
  padding: 12px 0;
  border-bottom: 1px solid #ebeef5;
}

.comment-item:last-child {
  border-bottom: none;
}

.timeline-item {
  padding: 12px 0;
}

.worklog-item {
  padding: 12px 0;
  border-bottom: 1px solid #ebeef5;
}

.worklog-item:last-child {
  border-bottom: none;
}
</style>
