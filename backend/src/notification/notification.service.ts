import { Injectable } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { CreateNotificationDto } from "./dto/create-notification.dto";
import { Notification } from "@prisma/client";

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateNotificationDto): Promise<Notification> {
    return this.prisma.notification.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        content: dto.content,
        commentId: dto.commentId,
        taskId: dto.taskId,
      },
    });
  }

  async findByUser(userId: string): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: { userId },
      include: {
        comment: {
          select: {
            id: true,
            content: true,
            author: { select: { id: true, name: true, avatar: true } },
          },
        },
        task: {
          select: { id: true, title: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new Error("通知不存在");
    }

    if (notification.userId !== userId) {
      throw new Error("无权操作该通知");
    }

    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, read: false },
    });
  }
}
