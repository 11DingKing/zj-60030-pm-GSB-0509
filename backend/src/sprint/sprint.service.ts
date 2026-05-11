import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { RedisService } from "../common/redis/redis.service";
import { CreateSprintDto } from "./dto/create-sprint.dto";
import { UpdateSprintDto } from "./dto/update-sprint.dto";
import { Sprint, TaskStatus, TaskType, UserRole, Prisma } from "@prisma/client";

const sprintWithTasks = Prisma.validator<Prisma.SprintDefaultArgs>()({
  include: {
    project: {
      select: {
        ownerId: true,
        members: { select: { id: true } },
      },
    },
    tasks: {
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
        statusLogs: {
          include: {
            user: { select: { id: true, name: true } },
          },
          orderBy: { changedAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    },
  },
});

type SprintWithTasks = Prisma.SprintGetPayload<typeof sprintWithTasks>;

@Injectable()
export class SprintService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  async findByProject(projectId: string, userId: string): Promise<Sprint[]> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        ownerId: true,
        members: { select: { id: true } },
      },
    });

    if (!project) {
      throw new NotFoundException("项目不存在");
    }

    const isMember =
      project.ownerId === userId ||
      project.members.some((m) => m.id === userId);

    if (!isMember) {
      throw new ForbiddenException("无权访问该项目");
    }

    return this.prisma.sprint.findMany({
      where: { projectId },
      include: {
        _count: { select: { tasks: true } },
        tasks: {
          select: {
            status: true,
            storyPoints: true,
          },
        },
      },
      orderBy: { startDate: "asc" },
    });
  }

  async findById(id: string, userId: string): Promise<SprintWithTasks> {
    const sprint = await this.prisma.sprint.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            ownerId: true,
            members: { select: { id: true } },
          },
        },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, avatar: true } },
            statusLogs: {
              include: {
                user: { select: { id: true, name: true } },
              },
              orderBy: { changedAt: "asc" },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!sprint) {
      throw new NotFoundException("Sprint 不存在");
    }

    const isMember =
      sprint.project.ownerId === userId ||
      sprint.project.members.some((m) => m.id === userId);

    if (!isMember) {
      throw new ForbiddenException("无权访问该 Sprint");
    }

    return sprint;
  }

  async create(
    createSprintDto: CreateSprintDto,
    userId: string,
    userRole: UserRole,
  ): Promise<Sprint> {
    if (userRole !== UserRole.PROJECT_MANAGER) {
      throw new ForbiddenException("只有项目经理可以创建 Sprint");
    }

    const project = await this.prisma.project.findUnique({
      where: { id: createSprintDto.projectId },
      select: { ownerId: true },
    });

    if (!project) {
      throw new NotFoundException("项目不存在");
    }

    if (project.ownerId !== userId) {
      throw new ForbiddenException("只有项目负责人可以创建 Sprint");
    }

    const sprint = await this.prisma.sprint.create({
      data: {
        name: createSprintDto.name,
        goal: createSprintDto.goal,
        startDate: new Date(createSprintDto.startDate),
        endDate: new Date(createSprintDto.endDate),
        status: createSprintDto.status,
        projectId: createSprintDto.projectId,
      },
      include: {
        _count: { select: { tasks: true } },
      },
    });

    await this.redisService.delPattern(`dashboard:project:*`);
    return sprint;
  }

  async update(
    id: string,
    updateSprintDto: UpdateSprintDto,
    userId: string,
  ): Promise<Sprint> {
    const sprint = await this.prisma.sprint.findUnique({
      where: { id },
      include: {
        project: { select: { ownerId: true } },
      },
    });

    if (!sprint) {
      throw new NotFoundException("Sprint 不存在");
    }

    if (sprint.project.ownerId !== userId) {
      throw new ForbiddenException("只有项目负责人可以修改 Sprint");
    }

    const updated = await this.prisma.sprint.update({
      where: { id },
      data: {
        name: updateSprintDto.name,
        goal: updateSprintDto.goal,
        startDate: updateSprintDto.startDate
          ? new Date(updateSprintDto.startDate)
          : undefined,
        endDate: updateSprintDto.endDate
          ? new Date(updateSprintDto.endDate)
          : undefined,
        status: updateSprintDto.status,
      },
      include: {
        _count: { select: { tasks: true } },
        tasks: {
          select: {
            status: true,
            storyPoints: true,
          },
        },
      },
    });

    await this.redisService.delPattern(`dashboard:project:*`);
    return updated;
  }

  async delete(id: string, userId: string): Promise<void> {
    const sprint = await this.prisma.sprint.findUnique({
      where: { id },
      include: {
        project: { select: { ownerId: true } },
      },
    });

    if (!sprint) {
      throw new NotFoundException("Sprint 不存在");
    }

    if (sprint.project.ownerId !== userId) {
      throw new ForbiddenException("只有项目负责人可以删除 Sprint");
    }

    await this.prisma.sprint.delete({ where: { id } });
    await this.redisService.delPattern(`dashboard:project:*`);
  }

  async getRetrospective(sprintId: string, userId: string) {
    const cacheKey = `retrospective:sprint:${sprintId}`;
    const cached = await this.redisService.getJson(cacheKey);
    if (cached) return cached;

    const sprint = await this.findById(sprintId, userId);

    const plannedStoryPoints = sprint.tasks.reduce(
      (sum, t) => sum + t.storyPoints,
      0,
    );
    const completedTasks = sprint.tasks.filter(
      (t) => t.status === TaskStatus.DONE,
    );
    const completedStoryPoints = completedTasks.reduce(
      (sum, t) => sum + t.storyPoints,
      0,
    );

    const memberStats = await this.prisma.user.findMany({
      where: {
        assignedTasks: {
          some: { sprintId, status: TaskStatus.DONE },
        },
      },
      select: {
        id: true,
        name: true,
        avatar: true,
        assignedTasks: {
          where: { sprintId, status: TaskStatus.DONE },
          select: { id: true },
        },
      },
    });

    const taskTypeStats = await this.prisma.task.groupBy({
      by: ["type"],
      where: { sprintId },
      _count: { id: true },
    });

    const taskStatusStats = await this.prisma.task.groupBy({
      by: ["status"],
      where: { sprintId },
      _count: { id: true },
    });

    const statusCounts: Record<string, number> = {
      [TaskStatus.TODO]: 0,
      [TaskStatus.IN_PROGRESS]: 0,
      [TaskStatus.TESTING]: 0,
      [TaskStatus.DONE]: 0,
    };

    taskStatusStats.forEach((stat) => {
      const status = stat.status || TaskStatus.TODO;
      statusCounts[status] = (statusCounts[status] || 0) + stat._count.id;
    });

    const nullStatusTasks = sprint.tasks.filter((t) => !t.status).length;
    if (nullStatusTasks > 0) {
      statusCounts[TaskStatus.TODO] += nullStatusTasks;
    }

    const todoTasksCount = statusCounts[TaskStatus.TODO];
    const inProgressTasksCount = statusCounts[TaskStatus.IN_PROGRESS];
    const testingTasksCount = statusCounts[TaskStatus.TESTING];
    const completedTasksCount = statusCounts[TaskStatus.DONE];

    const result = {
      sprint: {
        id: sprint.id,
        name: sprint.name,
        status: sprint.status,
        startDate: sprint.startDate,
        endDate: sprint.endDate,
      },
      storyPointsComparison: {
        planned: plannedStoryPoints,
        completed: completedStoryPoints,
        completionRate:
          plannedStoryPoints > 0
            ? (completedStoryPoints / plannedStoryPoints) * 100
            : 0,
      },
      memberStats: memberStats.map((m) => ({
        ...m,
        completedTasks: m.assignedTasks.length,
      })),
      taskTypeDistribution: taskTypeStats.map((t) => ({
        type: t.type,
        count: t._count.id,
      })),
      totalTasks: sprint.tasks.length,
      todoTasks: todoTasksCount,
      inProgressTasks: inProgressTasksCount,
      testingTasks: testingTasksCount,
      completedTasks: completedTasksCount,
    };

    await this.redisService.setJson(cacheKey, result, 300);
    return result;
  }

  async getKanban(sprintId: string, userId: string) {
    const cacheKey = `kanban:sprint:${sprintId}`;
    const cached = await this.redisService.getJson(cacheKey);
    if (cached) return cached;

    const sprint = await this.findById(sprintId, userId);

    const columns: Record<TaskStatus, any[]> = {
      [TaskStatus.TODO]: [],
      [TaskStatus.IN_PROGRESS]: [],
      [TaskStatus.TESTING]: [],
      [TaskStatus.DONE]: [],
    };

    const tasks = await this.prisma.task.findMany({
      where: { sprintId },
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
        creator: { select: { id: true, name: true, avatar: true } },
        statusLogs: {
          include: {
            user: { select: { id: true, name: true } },
          },
          orderBy: { changedAt: "desc" },
        },
        comments: {
          take: 3,
          include: {
            author: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { comments: true, worklogs: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    tasks.forEach((task) => {
      const status = task.status || TaskStatus.TODO;
      columns[status].push(task);
    });

    const result = {
      sprint: {
        id: sprint.id,
        name: sprint.name,
        status: sprint.status,
      },
      columns: Object.entries(columns).map(([status, tasks]) => ({
        status,
        tasks,
        count: tasks.length,
      })),
      stats: {
        total: tasks.length,
        todo: columns[TaskStatus.TODO].length,
        inProgress: columns[TaskStatus.IN_PROGRESS].length,
        testing: columns[TaskStatus.TESTING].length,
        done: columns[TaskStatus.DONE].length,
      },
    };

    await this.redisService.setJson(cacheKey, result, 60);
    return result;
  }
}
