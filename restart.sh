#!/bin/bash

echo "=========================================="
echo "  项目任务管理系统 - 重启脚本"
echo "=========================================="
echo ""

PROJECT_ROOT=$(cd "$(dirname "$0")" && pwd)
BACKEND_PORT=3000
FRONTEND_PORT=5173

echo "停止现有服务..."

PIDS=$(lsof -ti :$BACKEND_PORT -ti :$FRONTEND_PORT 2>/dev/null)
if [ -n "$PIDS" ]; then
  kill $PIDS 2>/dev/null
  echo "✓ 已停止端口 $BACKEND_PORT 和 $FRONTEND_PORT 的服务"
else
  echo "⚠️ 未发现运行中的服务"
fi

sleep 2

echo ""
echo "启动服务..."
cd "$PROJECT_ROOT"
./start.sh
