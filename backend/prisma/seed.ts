import {
  PrismaClient,
  UserRole,
  SprintStatus,
  TaskPriority,
  TaskType,
  TaskStatus,
} from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

async function main() {
  console.log("开始创建种子数据...");

  await prisma.worklog.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.taskStatusLog.deleteMany();
  await prisma.task.deleteMany();
  await prisma.sprint.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  console.log("创建用户...");
  const password = await bcrypt.hash("123456", SALT_ROUNDS);

  const [pm, dev1, dev2, dev3] = await prisma.$transaction([
    prisma.user.create({
      data: {
        email: "pm@example.com",
        password,
        name: "张明",
        role: UserRole.PROJECT_MANAGER,
      },
    }),
    prisma.user.create({
      data: {
        email: "dev1@example.com",
        password,
        name: "李华",
        role: UserRole.DEVELOPER,
      },
    }),
    prisma.user.create({
      data: {
        email: "dev2@example.com",
        password,
        name: "王强",
        role: UserRole.DEVELOPER,
      },
    }),
    prisma.user.create({
      data: {
        email: "dev3@example.com",
        password,
        name: "赵丽",
        role: UserRole.DEVELOPER,
      },
    }),
  ]);

  const users = [pm, dev1, dev2, dev3];
  console.log(
    "用户创建完成:",
    users.map((u) => `${u.name} - ${u.role}`),
  );

  console.log("创建项目...");
  const project = await prisma.project.create({
    data: {
      name: "电商平台重构项目",
      description:
        "对现有电商平台进行全面重构，包括前端 Vue 升级、后端微服务化改造、性能优化等。",
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-06-30"),
      ownerId: pm.id,
      members: {
        connect: users.map((u) => ({ id: u.id })),
      },
    },
    include: { members: true },
  });
  console.log("项目创建完成:", project.name);

  console.log("创建 Sprint...");
  const now = new Date();
  const sprints = [
    {
      name: "Sprint 1 - 基础架构",
      goal: "完成项目基础架构搭建，包括开发环境、CI/CD、数据库设计",
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-01-14"),
      status: SprintStatus.COMPLETED,
    },
    {
      name: "Sprint 2 - 用户系统",
      goal: "完成用户注册、登录、个人信息管理功能",
      startDate: new Date("2024-01-15"),
      endDate: new Date("2024-01-28"),
      status: SprintStatus.COMPLETED,
    },
    {
      name: "Sprint 3 - 商品系统",
      goal: "完成商品列表、详情、搜索、购物车功能",
      startDate: new Date("2024-01-29"),
      endDate: new Date("2024-02-11"),
      status: SprintStatus.IN_PROGRESS,
    },
  ];

  const createdSprints = await Promise.all(
    sprints.map((sprint) =>
      prisma.sprint.create({
        data: {
          ...sprint,
          projectId: project.id,
        },
      }),
    ),
  );
  console.log(
    "Sprint 创建完成:",
    createdSprints.map((s) => s.name),
  );

  console.log("创建任务...");

  const taskTemplates = [
    {
      title: "搭建前端项目初始化",
      type: TaskType.TECH_DEBT,
      points: 3,
      priority: TaskPriority.HIGH,
    },
    {
      title: "搭建后端项目初始化",
      type: TaskType.TECH_DEBT,
      points: 3,
      priority: TaskPriority.HIGH,
    },
    {
      title: "配置 Docker 开发环境",
      type: TaskType.TECH_DEBT,
      points: 5,
      priority: TaskPriority.MEDIUM,
    },
    {
      title: "设计用户表结构",
      type: TaskType.TECH_DEBT,
      points: 2,
      priority: TaskPriority.MEDIUM,
    },
    {
      title: "设计商品表结构",
      type: TaskType.TECH_DEBT,
      points: 3,
      priority: TaskPriority.MEDIUM,
    },
    {
      title: "设计订单表结构",
      type: TaskType.TECH_DEBT,
      points: 5,
      priority: TaskPriority.MEDIUM,
    },
    {
      title: "配置 CI/CD 流程",
      type: TaskType.TECH_DEBT,
      points: 5,
      priority: TaskPriority.MEDIUM,
    },
    {
      title: "编写代码规范文档",
      type: TaskType.REQUIREMENT,
      points: 2,
      priority: TaskPriority.LOW,
    },
    {
      title: "修复首页加载慢问题",
      type: TaskType.BUG,
      points: 3,
      priority: TaskPriority.URGENT,
    },
    {
      title: "优化数据库查询性能",
      type: TaskType.OPTIMIZATION,
      points: 5,
      priority: TaskPriority.HIGH,
    },

    {
      title: "用户注册功能开发",
      type: TaskType.REQUIREMENT,
      points: 5,
      priority: TaskPriority.HIGH,
    },
    {
      title: "用户登录功能开发",
      type: TaskType.REQUIREMENT,
      points: 5,
      priority: TaskPriority.HIGH,
    },
    {
      title: "JWT 鉴权实现",
      type: TaskType.TECH_DEBT,
      points: 3,
      priority: TaskPriority.HIGH,
    },
    {
      title: "找回密码功能",
      type: TaskType.REQUIREMENT,
      points: 3,
      priority: TaskPriority.MEDIUM,
    },
    {
      title: "个人信息管理",
      type: TaskType.REQUIREMENT,
      points: 3,
      priority: TaskPriority.MEDIUM,
    },
    {
      title: "头像上传功能",
      type: TaskType.REQUIREMENT,
      points: 2,
      priority: TaskPriority.LOW,
    },
    {
      title: "登录验证码功能",
      type: TaskType.REQUIREMENT,
      points: 3,
      priority: TaskPriority.MEDIUM,
    },
    {
      title: "修复登录状态丢失问题",
      type: TaskType.BUG,
      points: 2,
      priority: TaskPriority.HIGH,
    },
    {
      title: "优化登录接口响应时间",
      type: TaskType.OPTIMIZATION,
      points: 2,
      priority: TaskPriority.MEDIUM,
    },
    {
      title: "用户权限控制",
      type: TaskType.TECH_DEBT,
      points: 5,
      priority: TaskPriority.HIGH,
    },

    {
      title: "商品列表页面",
      type: TaskType.REQUIREMENT,
      points: 5,
      priority: TaskPriority.HIGH,
    },
    {
      title: "商品详情页面",
      type: TaskType.REQUIREMENT,
      points: 5,
      priority: TaskPriority.HIGH,
    },
    {
      title: "商品搜索功能",
      type: TaskType.REQUIREMENT,
      points: 8,
      priority: TaskPriority.HIGH,
    },
    {
      title: "购物车功能",
      type: TaskType.REQUIREMENT,
      points: 8,
      priority: TaskPriority.HIGH,
    },
    {
      title: "商品分类功能",
      type: TaskType.REQUIREMENT,
      points: 3,
      priority: TaskPriority.MEDIUM,
    },
    {
      title: "商品图片上传",
      type: TaskType.REQUIREMENT,
      points: 3,
      priority: TaskPriority.MEDIUM,
    },
    {
      title: "商品库存管理",
      type: TaskType.REQUIREMENT,
      points: 5,
      priority: TaskPriority.MEDIUM,
    },
    {
      title: "修复商品价格显示错误",
      type: TaskType.BUG,
      points: 2,
      priority: TaskPriority.HIGH,
    },
    {
      title: "优化商品列表性能",
      type: TaskType.OPTIMIZATION,
      points: 3,
      priority: TaskPriority.MEDIUM,
    },
    {
      title: "ES 搜索集成",
      type: TaskType.TECH_DEBT,
      points: 13,
      priority: TaskPriority.MEDIUM,
    },
  ];

  const statuses = [
    TaskStatus.TODO,
    TaskStatus.IN_PROGRESS,
    TaskStatus.TESTING,
    TaskStatus.DONE,
  ];
  const createdTasks: Awaited<ReturnType<typeof prisma.task.create>>[] = [];

  for (let i = 0; i < taskTemplates.length; i++) {
    const template = taskTemplates[i];
    const sprintIndex = i < 10 ? 0 : i < 20 ? 1 : 2;
    const sprint = createdSprints[sprintIndex];
    const assigneeIndex = i % 4;
    const assignee = users[assigneeIndex];

    let statusIndex: number;
    if (sprintIndex < 2) {
      statusIndex = 3;
    } else {
      statusIndex = i % 4;
    }
    const status = statuses[statusIndex];

    const dueDate = new Date(sprint.endDate);
    dueDate.setDate(dueDate.getDate() - Math.floor(Math.random() * 3));

    const task = await prisma.task.create({
      data: {
        title: template.title,
        description: `这是【${template.title}】的详细描述。该任务属于${getTypeText(template.type)}类型，预估${template.points}个故事点，优先级为${getPriorityText(template.priority)}。`,
        type: template.type,
        priority: template.priority,
        storyPoints: template.points,
        status,
        dueDate,
        assigneeId: assignee.id,
        creatorId: pm.id,
        sprintId: sprint.id,
        projectId: project.id,
      },
    });
    createdTasks.push(task);
    console.log(`创建任务: ${task.title} - ${status}`);
  }

  console.log("创建任务状态变更日志...");
  const statusTransitions = [
    [TaskStatus.TODO],
    [TaskStatus.TODO, TaskStatus.IN_PROGRESS],
    [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.TESTING],
    [
      TaskStatus.TODO,
      TaskStatus.IN_PROGRESS,
      TaskStatus.TESTING,
      TaskStatus.DONE,
    ],
  ];

  for (const task of createdTasks) {
    const currentStatusIndex = statuses.indexOf(task.status);
    const transitions = statusTransitions[currentStatusIndex];

    for (let j = 0; j < transitions.length - 1; j++) {
      const oldStatus = transitions[j];
      const newStatus = transitions[j + 1];
      const randomUser = users[Math.floor(Math.random() * users.length)];

      const changedAt = new Date(task.createdAt);
      changedAt.setHours(
        changedAt.getHours() + (j + 1) * 4 + Math.floor(Math.random() * 4),
      );

      await prisma.taskStatusLog.create({
        data: {
          taskId: task.id,
          userId: randomUser.id,
          oldStatus,
          newStatus,
          changedAt,
        },
      });
    }
  }
  console.log("状态变更日志创建完成");

  console.log("创建评论...");
  const commentContents = [
    "这个任务我已经开始了，预计明天可以完成。",
    "代码已经提交 PR，请帮忙 review 一下。",
    "测试通过了，可以合并了。",
    "发现一个小问题，需要修复一下。",
    "这个功能已经完成，可以关闭了。",
    "@李华 这个任务你那边进展如何？",
    "需要和产品确认一下需求细节。",
    "UI 设计稿已经更新，请查看最新版本。",
  ];

  for (let i = 0; i < 15; i++) {
    const taskIndex = i % createdTasks.length;
    const task = createdTasks[taskIndex];
    const userIndex = i % users.length;
    const user = users[userIndex];

    const mentionedUsers: typeof users = [];
    if (i % 3 === 0) {
      const mentionIndex = (userIndex + 1) % users.length;
      mentionedUsers.push(users[mentionIndex]);
    }

    await prisma.comment.create({
      data: {
        content: commentContents[i % commentContents.length],
        taskId: task.id,
        authorId: user.id,
        mentions:
          mentionedUsers.length > 0
            ? {
                connect: mentionedUsers.map((u) => ({ id: u.id })),
              }
            : undefined,
      },
    });
  }
  console.log("评论创建完成");

  console.log("创建工时记录...");
  for (let i = 0; i < 20; i++) {
    const taskIndex = i % createdTasks.length;
    const task = createdTasks[taskIndex];
    const userIndex = i % users.length;
    const user = users[userIndex];

    const workDate = new Date(task.createdAt);
    workDate.setDate(workDate.getDate() + Math.floor(Math.random() * 7));

    const hours = Math.floor(Math.random() * 8) + 1;

    await prisma.worklog.create({
      data: {
        taskId: task.id,
        userId: user.id,
        workDate,
        hours,
        description: `完成了${task.title}的部分工作，耗时${hours}小时。`,
      },
    });
  }
  console.log("工时记录创建完成");

  console.log("\n========== 种子数据创建完成 ==========");
  console.log("\n登录账号信息:");
  console.log("项目经理: pm@example.com / 123456");
  console.log("开发人员1: dev1@example.com / 123456");
  console.log("开发人员2: dev2@example.com / 123456");
  console.log("开发人员3: dev3@example.com / 123456");
  console.log("\n数据统计:");
  console.log(`- 用户: ${users.length} 个`);
  console.log(`- 项目: 1 个`);
  console.log(`- Sprint: ${createdSprints.length} 个`);
  console.log(`- 任务: ${createdTasks.length} 个`);
}

function getTypeText(type: TaskType): string {
  const texts: Record<TaskType, string> = {
    [TaskType.REQUIREMENT]: "需求",
    [TaskType.BUG]: "Bug",
    [TaskType.OPTIMIZATION]: "优化",
    [TaskType.TECH_DEBT]: "技术债务",
  };
  return texts[type];
}

function getPriorityText(priority: TaskPriority): string {
  const texts: Record<TaskPriority, string> = {
    [TaskPriority.URGENT]: "紧急",
    [TaskPriority.HIGH]: "高",
    [TaskPriority.MEDIUM]: "中",
    [TaskPriority.LOW]: "低",
  };
  return texts[priority];
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
