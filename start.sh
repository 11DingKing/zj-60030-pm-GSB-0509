#!/bin/bash

echo "=========================================="
echo "  项目任务管理系统 - 启动脚本"
echo "=========================================="
echo ""

PROJECT_ROOT=$(cd "$(dirname "$0")" && pwd)
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
DB_NAME="db_zj_60030"
DB_USER="dev"
DB_PASSWORD="dev123456"
DB_HOST="localhost"
DB_PORT="5432"
BACKEND_PORT=3000
FRONTEND_PORT=5173

echo "项目目录: $PROJECT_ROOT"
echo ""

check_node() {
  if ! command -v node &> /dev/null; then
    echo "❌ 错误: Node.js 未安装，请先安装 Node.js (建议 v18+)"
    exit 1
  fi
  echo "✓ Node.js 版本: $(node --version)"
}

check_npm() {
  if ! command -v npm &> /dev/null; then
    echo "❌ 错误: npm 未安装"
    exit 1
  fi
  echo "✓ npm 版本: $(npm --version)"
}

check_docker() {
  if command -v docker &> /dev/null; then
    echo "✓ Docker 已安装"
    return 0
  else
    echo "⚠️ Docker 未安装，无法自动创建数据库"
    return 1
  fi
}

create_database() {
  echo ""
  echo "检查数据库..."
  
  if check_docker; then
    echo "尝试使用 Docker 创建数据库..."
    
    DB_EXISTS=$(docker exec -e PGPASSWORD="$DB_PASSWORD" dev-postgres psql -U "$DB_USER" -d postgres -t -c "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME';" 2>/dev/null)
    
    if [ "$DB_EXISTS" = "1" ]; then
      echo "✓ 数据库 $DB_NAME 已存在"
    else
      echo "创建数据库 $DB_NAME..."
      docker exec -e PGPASSWORD="$DB_PASSWORD" dev-postgres psql -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME;" 2>/dev/null
      if [ $? -eq 0 ]; then
        echo "✓ 数据库 $DB_NAME 创建成功"
      else
        echo "⚠️ 无法通过 Docker 创建数据库，请手动执行:"
        echo "   docker exec -e PGPASSWORD=$DB_PASSWORD dev-postgres psql -U $DB_USER -d postgres -c \"CREATE DATABASE $DB_NAME;\""
      fi
    fi
  else
    echo "⚠️ 请确保数据库 $DB_NAME 已创建，连接信息:"
    echo "   Host: $DB_HOST"
    echo "   Port: $DB_PORT"
    echo "   User: $DB_USER"
    echo "   Database: $DB_NAME"
  fi
}

install_dependencies() {
  echo ""
  echo "安装后端依赖..."
  cd "$BACKEND_DIR"
  if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -ne 0 ]; then
      echo "❌ 后端依赖安装失败"
      exit 1
    fi
    echo "✓ 后端依赖安装完成"
  else
    echo "✓ 后端依赖已存在"
  fi

  echo ""
  echo "安装前端依赖..."
  cd "$FRONTEND_DIR"
  if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -ne 0 ]; then
      echo "❌ 前端依赖安装失败"
      exit 1
    fi
    echo "✓ 前端依赖安装完成"
  else
    echo "✓ 前端依赖已存在"
  fi
}

setup_prisma() {
  echo ""
  echo "配置 Prisma..."
  cd "$BACKEND_DIR"
  
  echo "生成 Prisma Client..."
  npx prisma generate
  if [ $? -ne 0 ]; then
    echo "⚠️ Prisma Client 生成可能有问题，请检查"
  else
    echo "✓ Prisma Client 生成完成"
  fi
}

run_migrations() {
  echo ""
  echo "执行数据库迁移..."
  cd "$BACKEND_DIR"
  
  if [ ! -d "prisma/migrations" ] || [ -z "$(ls -A prisma/migrations 2>/dev/null)" ]; then
    echo "首次运行，执行初始化迁移..."
    npx prisma migrate dev --name init --skip-generate
    if [ $? -eq 0 ]; then
      echo "✓ 数据库迁移完成"
    else
      echo "⚠️ 数据库迁移可能有问题，尝试继续..."
    fi
  else
    echo "✓ 迁移目录已存在，跳过初始化"
  fi
}

run_seed() {
  echo ""
  echo "执行种子数据..."
  cd "$BACKEND_DIR"
  
  echo "尝试检查种子数据是否已存在..."
  
  USER_COUNT=$(npx prisma db execute --stdin 2>/dev/null <<EOF
SELECT COUNT(*) as count FROM users;
EOF
  | grep -o '[0-9]\+' | head -1)
  
  if [ -n "$USER_COUNT" ] && [ "$USER_COUNT" -gt 0 ]; then
    echo "✓ 种子数据已存在 (用户数: $USER_COUNT)，跳过"
  else
    echo "执行种子数据脚本..."
    npm run prisma:seed
    if [ $? -eq 0 ]; then
      echo "✓ 种子数据执行完成"
    else
      echo "⚠️ 种子数据执行可能有问题，请手动执行: cd backend && npm run prisma:seed"
    fi
  fi
}

echo "检查环境..."
check_node
check_npm

create_database
install_dependencies
setup_prisma
run_migrations
run_seed

echo ""
echo "=========================================="
echo "  启动服务"
echo "=========================================="
echo ""

echo "停止现有服务..."
PIDS=$(lsof -ti :$BACKEND_PORT -ti :$FRONTEND_PORT 2>/dev/null)
if [ -n "$PIDS" ]; then
  kill $PIDS 2>/dev/null
  echo "✓ 已停止端口 $BACKEND_PORT 和 $FRONTEND_PORT 的服务"
  sleep 2
fi

echo "启动后端服务 (端口: $BACKEND_PORT)..."
cd "$BACKEND_DIR"
npm run start:dev &
BACKEND_PID=$!
echo "后端服务 PID: $BACKEND_PID"

sleep 3

echo "启动前端服务 (端口: $FRONTEND_PORT)..."
cd "$FRONTEND_DIR"
npm run dev &
FRONTEND_PID=$!
echo "前端服务 PID: $FRONTEND_PID"

echo ""
echo "=========================================="
echo "  服务启动完成"
echo "=========================================="
echo ""
echo "📊 后端 API: http://localhost:$BACKEND_PORT"
echo "🌐 前端页面: http://localhost:$FRONTEND_PORT"
echo "📚 API 文档: http://localhost:$BACKEND_PORT/api"
echo ""
echo "登录账号:"
echo "  - 项目经理: pm@example.com / 123456"
echo "  - 开发人员: dev1@example.com / 123456"
echo "                dev2@example.com / 123456"
echo "                dev3@example.com / 123456"
echo ""
echo "按 Ctrl+C 停止服务"
echo ""

wait $BACKEND_PID $FRONTEND_PID
