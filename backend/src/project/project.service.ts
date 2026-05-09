import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Project, UserRole } from '@prisma/client';

@Injectable()
export class ProjectService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  async findAll(userId: string): Promise<Project[]> {
    const cacheKey = `projects:user:${userId}`;
    const cached = await this.redisService.getJson<Project[]>(cacheKey);
    if (cached) return cached;

    const projects = await this.prisma.project.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { id: userId } } },
        ],
      },
      include: {
        owner: { select: { id: true, name: true, email: true, avatar: true, role: true } },
        members: { select: { id: true, name: true, email: true, avatar: true, role: true } },
        sprints: { orderBy: { startDate: 'asc' } },
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    await this.redisService.setJson(cacheKey, projects, 300);
    return projects;
  }

  async findById(id: string, userId: string): Promise<Project> {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true, avatar: true, role: true } },
        members: { select: { id: true, name: true, email: true, avatar: true, role: true } },
        sprints: {
          orderBy: { startDate: 'asc' },
          include: {
            _count: { select: { tasks: true } },
            tasks: {
              select: {
                status: true,
                storyPoints: true,
              },
            },
          },
        },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, avatar: true } },
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('项目不存在');
    }

    const isMember = project.ownerId === userId || 
      project.members.some(m => m.id === userId);
    
    if (!isMember) {
      throw new ForbiddenException('无权访问该项目');
    }

    return project;
  }

  async create(createProjectDto: CreateProjectDto, userId: string, userRole: UserRole): Promise<Project> {
    if (userRole !== UserRole.PROJECT_MANAGER) {
      throw new ForbiddenException('只有项目经理可以创建项目');
    }

    const project = await this.prisma.project.create({
      data: {
        name: createProjectDto.name,
        description: createProjectDto.description,
        startDate: new Date(createProjectDto.startDate),
        endDate: new Date(createProjectDto.endDate),
        ownerId: userId,
        members: createProjectDto.memberIds?.length
          ? { connect: createProjectDto.memberIds.map(id => ({ id })) }
          : undefined,
      },
      include: {
        owner: { select: { id: true, name: true, email: true, avatar: true, role: true } },
        members: { select: { id: true, name: true, email: true, avatar: true, role: true } },
      },
    });

    await this.redisService.delPattern(`projects:user:*`);
    return project;
  }

  async update(id: string, updateProjectDto: UpdateProjectDto, userId: string): Promise<Project> {
    const project = await this.prisma.project.findUnique({
      where: { id },
      select: { ownerId: true },
    });

    if (!project) {
      throw new NotFoundException('项目不存在');
    }

    if (project.ownerId !== userId) {
      throw new ForbiddenException('只有项目负责人可以修改项目');
    }

    const updated = await this.prisma.project.update({
      where: { id },
      data: {
        name: updateProjectDto.name,
        description: updateProjectDto.description,
        startDate: updateProjectDto.startDate ? new Date(updateProjectDto.startDate) : undefined,
        endDate: updateProjectDto.endDate ? new Date(updateProjectDto.endDate) : undefined,
        members: updateProjectDto.memberIds
          ? { set: updateProjectDto.memberIds.map(id => ({ id })) }
          : undefined,
      },
      include: {
        owner: { select: { id: true, name: true, email: true, avatar: true, role: true } },
        members: { select: { id: true, name: true, email: true, avatar: true, role: true } },
      },
    });

    await this.redisService.delPattern(`projects:user:*`);
    return updated;
  }

  async delete(id: string, userId: string): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id },
      select: { ownerId: true },
    });

    if (!project) {
      throw new NotFoundException('项目不存在');
    }

    if (project.ownerId !== userId) {
      throw new ForbiddenException('只有项目负责人可以删除项目');
    }

    await this.prisma.project.delete({ where: { id } });
    await this.redisService.delPattern(`projects:user:*`);
  }

  async getDashboard(projectId: string, userId: string) {
    const cacheKey = `dashboard:project:${projectId}`;
    const cached = await this.redisService.getJson(cacheKey);
    if (cached) return cached;

    const project = await this.findById(projectId, userId);

    const sprints = await this.prisma.sprint.findMany({
      where: { projectId },
      orderBy: { startDate: 'asc' },
      include: {
        tasks: {
          select: {
            status: true,
            storyPoints: true,
          },
        },
      },
    });

    const today = new Date();
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + 7);

    const upcomingTasks = await this.prisma.task.findMany({
      where: {
        projectId,
        dueDate: {
          gte: today,
          lte: endOfWeek,
        },
        status: { not: 'DONE' },
      },
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    const memberWorkloads = await this.prisma.user.findMany({
      where: {
        OR: [
          { memberProjects: { some: { id: projectId } } },
          { projects: { some: { id: projectId } } },
        ],
      },
      select: {
        id: true,
        name: true,
        avatar: true,
        assignedTasks: {
          where: {
            projectId,
            status: { not: 'DONE' },
          },
          select: {
            storyPoints: true,
          },
        },
      },
    });

    const result = {
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        startDate: project.startDate,
        endDate: project.endDate,
      },
      sprints: sprints.map(sprint => ({
        id: sprint.id,
        name: sprint.name,
        status: sprint.status,
        startDate: sprint.startDate,
        endDate: sprint.endDate,
        totalStoryPoints: sprint.tasks.reduce((sum, t) => sum + t.storyPoints, 0),
        completedStoryPoints: sprint.tasks
          .filter(t => t.status === 'DONE')
          .reduce((sum, t) => sum + t.storyPoints, 0),
        totalTasks: sprint.tasks.length,
        completedTasks: sprint.tasks.filter(t => t.status === 'DONE').length,
      })),
      upcomingTasks,
      memberWorkloads: memberWorkloads.map(member => ({
        ...member,
        pendingStoryPoints: member.assignedTasks.reduce((sum, t) => sum + t.storyPoints, 0),
        pendingTasks: member.assignedTasks.length,
      })),
    };

    await this.redisService.setJson(cacheKey, result, 60);
    return result;
  }
}
