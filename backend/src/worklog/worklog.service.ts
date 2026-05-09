import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateWorklogDto } from './dto/create-worklog.dto';
import { Worklog } from '@prisma/client';

@Injectable()
export class WorklogService {
  constructor(private prisma: PrismaService) {}

  async findByTask(taskId: string, userId: string): Promise<Worklog[]> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          select: {
            ownerId: true,
            members: { select: { id: true } },
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    const isMember = task.project.ownerId === userId || 
      task.project.members.some(m => m.id === userId);
    
    if (!isMember) {
      throw new ForbiddenException('无权访问该任务的工时记录');
    }

    return this.prisma.worklog.findMany({
      where: { taskId },
      include: {
        user: { select: { id: true, name: true, avatar: true, email: true } },
      },
      orderBy: { workDate: 'desc' },
    });
  }

  async findByUser(userId: string): Promise<Worklog[]> {
    return this.prisma.worklog.findMany({
      where: { userId },
      include: {
        task: { select: { id: true, title: true } },
      },
      orderBy: { workDate: 'desc' },
    });
  }

  async create(createWorklogDto: CreateWorklogDto, userId: string): Promise<Worklog> {
    const task = await this.prisma.task.findUnique({
      where: { id: createWorklogDto.taskId },
      include: {
        project: {
          select: {
            ownerId: true,
            members: { select: { id: true } },
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    const isMember = task.project.ownerId === userId || 
      task.project.members.some(m => m.id === userId);
    
    if (!isMember) {
      throw new ForbiddenException('无权在该任务中创建工时记录');
    }

    return this.prisma.worklog.create({
      data: {
        taskId: createWorklogDto.taskId,
        userId,
        workDate: new Date(createWorklogDto.workDate),
        hours: createWorklogDto.hours,
        description: createWorklogDto.description,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });
  }

  async delete(id: string, userId: string): Promise<void> {
    const worklog = await this.prisma.worklog.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!worklog) {
      throw new NotFoundException('工时记录不存在');
    }

    if (worklog.userId !== userId) {
      throw new ForbiddenException('只能删除自己的工时记录');
    }

    await this.prisma.worklog.delete({ where: { id } });
  }
}
