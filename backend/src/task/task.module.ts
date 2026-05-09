import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { PrismaModule } from '../common/prisma/prisma.module';
import { RedisModule } from '../common/redis/redis.module';

@Module({
  imports: [PrismaModule, RedisModule],
  providers: [TaskService],
  controllers: [TaskController],
  exports: [TaskService],
})
export class TaskModule {}
