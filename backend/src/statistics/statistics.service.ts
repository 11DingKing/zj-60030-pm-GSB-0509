import { Injectable } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { RedisService } from "../common/redis/redis.service";
import { TaskStatus, TaskType } from "@prisma/client";

@Injectable()
export class StatisticsService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  async getBurnDownChart(sprintId: string, userId: string) {
    const cacheKey = `statistics:burndown:${sprintId}`;
    const cached = await this.redisService.getJson(cacheKey);
    if (cached) return cached;

    const sprint = await this.prisma.sprint.findUnique({
      where: { id: sprintId },
      include: {
        project: {
          select: { ownerId: true, members: { select: { id: true } } },
        },
        tasks: {
          include: { statusLogs: { orderBy: { changedAt: "asc" } } },
        },
      },
    });

    if (!sprint) {
      throw new Error("Sprint 不存在");
    }

    const isMember =
      sprint.project.ownerId === userId ||
      sprint.project.members.some((m) => m.id === userId);

    if (!isMember) {
      throw new Error("无权访问该 Sprint");
    }

    const startDate = new Date(sprint.startDate);
    const endDate = new Date(sprint.endDate);
    const totalDays =
      Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1;

    const totalStoryPoints = sprint.tasks.reduce(
      (sum, t) => sum + t.storyPoints,
      0,
    );

    const actualPoints: { date: string; remaining: number }[] = [];
    const idealPoints: { date: string; remaining: number }[] = [];

    for (let i = 0; i < totalDays; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateStr = currentDate.toISOString().split("T")[0];

      const idealRemaining =
        totalStoryPoints - (totalStoryPoints / (totalDays - 1)) * i;
      idealPoints.push({
        date: dateStr,
        remaining: Math.max(0, idealRemaining),
      });

      let actualRemaining = totalStoryPoints;
      sprint.tasks.forEach((task) => {
        const doneLog = task.statusLogs.find(
          (log) =>
            log.newStatus === TaskStatus.DONE &&
            new Date(log.changedAt) <= currentDate,
        );
        if (doneLog) {
          actualRemaining -= task.storyPoints;
        }
      });

      actualPoints.push({ date: dateStr, remaining: actualRemaining });
    }

    const result = {
      sprint: {
        id: sprint.id,
        name: sprint.name,
        startDate: sprint.startDate,
        endDate: sprint.endDate,
      },
      totalStoryPoints,
      idealLine: idealPoints,
      actualLine: actualPoints,
    };

    await this.redisService.setJson(cacheKey, result, 300);
    return result;
  }

  async getVelocityTrend(projectId: string, userId: string) {
    const cacheKey = `statistics:velocity:${projectId}`;
    const cached = await this.redisService.getJson(cacheKey);
    if (cached) return cached;

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: { select: { id: true } },
        sprints: {
          where: { status: "COMPLETED" },
          orderBy: { startDate: "asc" },
          include: {
            tasks: {
              select: { status: true, storyPoints: true },
            },
          },
        },
      },
    });

    if (!project) {
      throw new Error("项目不存在");
    }

    const isMember =
      project.ownerId === userId ||
      project.members.some((m) => m.id === userId);

    if (!isMember) {
      throw new Error("无权访问该项目");
    }

    const velocityData = project.sprints.map((sprint) => {
      const completedPoints = sprint.tasks
        .filter((t) => t.status === TaskStatus.DONE)
        .reduce((sum, t) => sum + t.storyPoints, 0);
      const plannedPoints = sprint.tasks.reduce(
        (sum, t) => sum + t.storyPoints,
        0,
      );

      return {
        sprintName: sprint.name,
        completedPoints,
        plannedPoints,
      };
    });

    const result = {
      project: {
        id: project.id,
        name: project.name,
      },
      velocityData,
      averageVelocity:
        velocityData.length > 0
          ? velocityData.reduce((sum, d) => sum + d.completedPoints, 0) /
            velocityData.length
          : 0,
    };

    await this.redisService.setJson(cacheKey, result, 300);
    return result;
  }

  async getMemberWorklog(projectId: string, userId: string) {
    const cacheKey = `statistics:worklog:${projectId}`;
    const cached = await this.redisService.getJson(cacheKey);
    if (cached) return cached;

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: { select: { id: true, name: true, avatar: true } },
        owner: { select: { id: true, name: true, avatar: true } },
        tasks: {
          include: {
            worklogs: {
              select: { userId: true, hours: true },
            },
          },
        },
      },
    });

    if (!project) {
      throw new Error("项目不存在");
    }

    const isMember =
      project.ownerId === userId ||
      project.members.some((m) => m.id === userId);

    if (!isMember) {
      throw new Error("无权访问该项目");
    }

    const allMembers = [project.owner, ...project.members];
    const worklogMap = new Map<string, number>();

    project.tasks.forEach((task) => {
      task.worklogs.forEach((worklog) => {
        const current = worklogMap.get(worklog.userId) || 0;
        worklogMap.set(worklog.userId, current + worklog.hours);
      });
    });

    const memberWorklogs = allMembers.map((member) => ({
      id: member.id,
      name: member.name,
      avatar: member.avatar,
      totalHours: worklogMap.get(member.id) || 0,
    }));

    const result = {
      project: {
        id: project.id,
        name: project.name,
      },
      memberWorklogs,
      totalHours: memberWorklogs.reduce((sum, m) => sum + m.totalHours, 0),
    };

    await this.redisService.setJson(cacheKey, result, 300);
    return result;
  }

  async getSprintStatusDistribution(sprintId: string, userId: string) {
    const cacheKey = `statistics:status:${sprintId}`;
    const cached = await this.redisService.getJson(cacheKey);
    if (cached) return cached;

    const sprint = await this.prisma.sprint.findUnique({
      where: { id: sprintId },
      include: {
        project: {
          select: { ownerId: true, members: { select: { id: true } } },
        },
      },
    });

    if (!sprint) {
      throw new Error("Sprint 不存在");
    }

    const isMember =
      sprint.project.ownerId === userId ||
      sprint.project.members.some((m) => m.id === userId);

    if (!isMember) {
      throw new Error("无权访问该 Sprint");
    }

    const statusGroups = await this.prisma.task.groupBy({
      by: ["status"],
      where: { sprintId },
      _count: { id: true },
    });

    const allStatuses: TaskStatus[] = [
      TaskStatus.TODO,
      TaskStatus.IN_PROGRESS,
      TaskStatus.TESTING,
      TaskStatus.DONE,
    ];

    const statusMap = new Map(statusGroups.map((g) => [g.status, g._count.id]));

    const distribution = allStatuses.map((status) => ({
      status,
      count: statusMap.get(status) || 0,
    }));

    const total = distribution.reduce((sum, d) => sum + d.count, 0);

    const result = {
      sprint: {
        id: sprint.id,
        name: sprint.name,
      },
      distribution,
      total,
    };

    await this.redisService.setJson(cacheKey, result, 300);
    return result;
  }

  async getBugTrend(projectId: string, userId: string) {
    const cacheKey = `statistics:bugs:${projectId}`;
    const cached = await this.redisService.getJson(cacheKey);
    if (cached) return cached;

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: { select: { id: true } },
        sprints: {
          orderBy: { startDate: "desc" },
          take: 6,
          include: {
            tasks: {
              where: { type: TaskType.BUG },
              select: { status: true },
            },
          },
        },
      },
    });

    if (!project) {
      throw new Error("项目不存在");
    }

    const isMember =
      project.ownerId === userId ||
      project.members.some((m) => m.id === userId);

    if (!isMember) {
      throw new Error("无权访问该项目");
    }

    const bugData = project.sprints
      .sort(
        (a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
      )
      .map((sprint) => {
        const totalBugs = sprint.tasks.length;
        const resolvedBugs = sprint.tasks.filter(
          (t) => t.status === TaskStatus.DONE,
        ).length;

        return {
          sprintName: sprint.name,
          totalBugs,
          resolvedBugs,
          unresolvedBugs: totalBugs - resolvedBugs,
        };
      });

    const result = {
      project: {
        id: project.id,
        name: project.name,
      },
      bugData,
      sprintsCount: project.sprints.length,
    };

    await this.redisService.setJson(cacheKey, result, 300);
    return result;
  }
}
