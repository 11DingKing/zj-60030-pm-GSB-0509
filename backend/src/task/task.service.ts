import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { Task, TaskStatus, UserRole } from '@prisma/client';

@Injectable()
export class TaskService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  async findAll(query: QueryTasksDto, userId: string): Promise<Task[]> {
    const where: any = {};

    if (query.projectId) {
      where.projectId = query.projectId;
    }

    if (query.sprintId) {
      where.sprintId = query.sprintId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.priority) {
      where.priority = query.priority;
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.assigneeId) {
      where.assigneeId = query.assigneeId;
    }

    const orderBy: any = {};
    if (query.sortBy) {
      orderBy[query.sortBy] = query.sortOrder || 'asc';
    } else {
      orderBy.createdAt = 'desc';
    }

    return this.prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, avatar: true, email: true } },
        creator: { select: { id: true, name: true, avatar: true, email: true } },
        sprint: { select: { id: true, name: true, status: true } },
        project: { select: { id: true, name: true } },
        statusLogs: {
          include: {
            user: { select: { id: true, name: true } },
          },
          orderBy: { changedAt: 'asc' },
        },
        comments: {
          include: {
            author: { select: { id: true, name: true, avatar: true } },
            mentions: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        worklogs: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { workDate: 'desc' },
        },
      },
      orderBy,
    });
  }

  async findById(id: string, userId: string): Promise<Task> {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        assignee: { select: { id: true, name: true, avatar: true, email: true, role: true } },
        creator: { select: { id: true, name: true, avatar: true, email: true, role: true } },
        sprint: { select: { id: true, name: true, status: true, startDate: true, endDate: true } },
        project: {
          select: {
            id: true,
            name: true,
            ownerId: true,
            members: { select: { id: true, name: true, avatar: true } },
          },
        },
        statusLogs: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { changedAt: 'asc' },
        },
        comments: {
          include: {
            author: { select: { id: true, name: true, avatar: true } },
            mentions: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        worklogs: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { workDate: 'desc' },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    const isMember = task.project.ownerId === userId || 
      task.project.members.some(m => m.id === userId);
    
    if (!isMember) {
      throw new ForbiddenException('无权访问该任务');
    }

    return task;
  }

  async create(createTaskDto: CreateTaskDto, userId: string): Promise<Task> {
    const project = await this.prisma.project.findUnique({
      where: { id: createTaskDto.projectId },
      select: {
        ownerId: true,
        members: { select: { id: true } },
      },
    });

    if (!project) {
      throw new NotFoundException('项目不存在');
    }

    const isMember = project.ownerId === userId || 
      project.members.some(m => m.id === userId);
    
    if (!isMember) {
      throw new ForbiddenException('无权在该项目中创建任务');
    }

    const task = await this.prisma.task.create({
      data: {
        title: createTaskDto.title,
        description: createTaskDto.description,
        priority: createTaskDto.priority,
        type: createTaskDto.type,
        storyPoints: createTaskDto.storyPoints || 3,
        status: createTaskDto.status || TaskStatus.TODO,
        dueDate: createTaskDto.dueDate ? new Date(createTaskDto.dueDate) : null,
        assigneeId: createTaskDto.assigneeId,
        creatorId: userId,
        sprintId: createTaskDto.sprintId,
        projectId: createTaskDto.projectId,
      },
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
        creator: { select: { id: true, name: true, avatar: true } },
      },
    });

    await this.clearTaskCaches(createTaskDto.projectId, createTaskDto.sprintId);
    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, userId: string): Promise<Task> {
    const existingTask = await this.prisma.task.findUnique({
      where: { id },
      include: {
        project: { select: { ownerId: true, members: { select: { id: true } } } },
      },
    });

    if (!existingTask) {
      throw new NotFoundException('任务不存在');
    }

    const isMember = existingTask.project.ownerId === userId || 
      existingTask.project.members.some(m => m.id === userId);
    
    if (!isMember) {
      throw new ForbiddenException('无权修改该任务');
    }

    let updatedTask;

    if (updateTaskDto.status && updateTaskDto.status !== existingTask.status) {
      updatedTask = await this.prisma.$transaction(async (prisma) => {
        const task = await prisma.task.update({
          where: { id },
          data: {
            title: updateTaskDto.title,
            description: updateTaskDto.description,
            priority: updateTaskDto.priority,
            type: updateTaskDto.type,
            storyPoints: updateTaskDto.storyPoints,
            status: updateTaskDto.status,
            dueDate: updateTaskDto.dueDate ? new Date(updateTaskDto.dueDate) : undefined,
            assigneeId: updateTaskDto.assigneeId,
            sprintId: updateTaskDto.sprintId,
          },
          include: {
            assignee: { select: { id: true, name: true, avatar: true } },
            creator: { select: { id: true, name: true, avatar: true } },
            statusLogs: {
              include: { user: { select: { id: true, name: true } } },
              orderBy: { changedAt: 'asc' },
            },
          },
        });

        await prisma.taskStatusLog.create({
          data: {
            taskId: id,
            userId,
            oldStatus: existingTask.status,
            newStatus: updateTaskDto.status!,
          },
        });

        return task;
      });
    } else {
      updatedTask = await this.prisma.task.update({
        where: { id },
        data: {
          title: updateTaskDto.title,
          description: updateTaskDto.description,
          priority: updateTaskDto.priority,
          type: updateTaskDto.type,
          storyPoints: updateTaskDto.storyPoints,
          dueDate: updateTaskDto.dueDate ? new Date(updateTaskDto.dueDate) : undefined,
          assigneeId: updateTaskDto.assigneeId,
          sprintId: updateTaskDto.sprintId,
        },
        include: {
          assignee: { select: { id: true, name: true, avatar: true } },
          creator: { select: { id: true, name: true, avatar: true } },
          statusLogs: {
            include: { user: { select: { id: true, name: true } } },
            orderBy: { changedAt: 'asc' },
          },
        },
      });
    }

    await this.clearTaskCaches(existingTask.projectId, existingTask.sprintId);
    return updatedTask;
  }

  async delete(id: string, userId: string): Promise<void> {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        project: { select: { ownerId: true, members: { select: { id: true } } } },
      },
    });

    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    if (task.project.ownerId !== userId) {
      throw new ForbiddenException('只有项目负责人可以删除任务');
    }

    await this.prisma.task.delete({ where: { id } });
    await this.clearTaskCaches(task.projectId, task.sprintId);
  }

  async updateStatus(id: string, newStatus: TaskStatus, userId: string) {
    const existingTask = await this.prisma.task.findUnique({
      where: { id },
      include: {
        project: { select: { ownerId: true, members: { select: { id: true } } } },
      },
    });

    if (!existingTask) {
      throw new NotFoundException('任务不存在');
    }

    const isMember = existingTask.project.ownerId === userId || 
      existingTask.project.members.some(m => m.id === userId);
    
    if (!isMember) {
      throw new ForbiddenException('无权修改该任务');
    }

    if (existingTask.status === newStatus) {
      return existingTask;
    }

    const updatedTask = await this.prisma.$transaction(async (prisma) => {
      const task = await prisma.task.update({
        where: { id },
        data: { status: newStatus },
        include: {
          assignee: { select: { id: true, name: true, avatar: true } },
          creator: { select: { id: true, name: true, avatar: true } },
          statusLogs: {
            include: { user: { select: { id: true, name: true, avatar: true } } },
            orderBy: { changedAt: 'desc' },
          },
        },
      });

      await prisma.taskStatusLog.create({
        data: {
          taskId: id,
          userId,
          oldStatus: existingTask.status,
          newStatus,
        },
      });

      return task;
    });

    await this.clearTaskCaches(existingTask.projectId, existingTask.sprintId);
    return updatedTask;
  }

  private async clearTaskCaches(projectId?: string, sprintId?: string): Promise<void> {
    await this.redisService.delPattern(`kanban:*`);
    await this.redisService.delPattern(`dashboard:*`);
    await this.redisService.delPattern(`retrospective:*`);
    await this.redisService.delPattern(`statistics:*`);
  }
}
