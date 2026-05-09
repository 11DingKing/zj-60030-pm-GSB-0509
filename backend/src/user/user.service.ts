import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<Omit<User, 'password'>[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { name: 'asc' },
    });
    return users.map(({ password, ...user }) => user);
  }

  async findById(id: string): Promise<Omit<User, 'password'> | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) return null;
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findByProject(projectId: string): Promise<Omit<User, 'password'>[]> {
    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { memberProjects: { some: { id: projectId } } },
          { projects: { some: { id: projectId } } },
        ],
      },
      orderBy: { name: 'asc' },
    });
    return users.map(({ password, ...user }) => user);
  }
}
