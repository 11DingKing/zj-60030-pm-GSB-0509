import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Comment } from '@prisma/client';

@Injectable()
export class CommentService {
  constructor(private prisma: PrismaService) {}

  async findByTask(taskId: string, userId: string): Promise<Comment[]> {
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
      throw new ForbiddenException('无权访问该任务的评论');
    }

    return this.prisma.comment.findMany({
      where: { taskId },
      include: {
        author: { select: { id: true, name: true, avatar: true, email: true } },
        mentions: { select: { id: true, name: true, avatar: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(createCommentDto: CreateCommentDto, userId: string): Promise<Comment> {
    const task = await this.prisma.task.findUnique({
      where: { id: createCommentDto.taskId },
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
      throw new ForbiddenException('无权在该任务中创建评论');
    }

    return this.prisma.comment.create({
      data: {
        content: createCommentDto.content,
        taskId: createCommentDto.taskId,
        authorId: userId,
        mentions: createCommentDto.mentionIds?.length
          ? { connect: createCommentDto.mentionIds.map(id => ({ id })) }
          : undefined,
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        mentions: { select: { id: true, name: true, avatar: true } },
      },
    });
  }

  async delete(id: string, userId: string): Promise<void> {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('只能删除自己的评论');
    }

    await this.prisma.comment.delete({ where: { id } });
  }
}
