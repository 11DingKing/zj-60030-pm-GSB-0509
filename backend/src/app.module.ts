import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ProjectModule } from './project/project.module';
import { SprintModule } from './sprint/sprint.module';
import { TaskModule } from './task/task.module';
import { CommentModule } from './comment/comment.module';
import { WorklogModule } from './worklog/worklog.module';
import { StatisticsModule } from './statistics/statistics.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    UserModule,
    ProjectModule,
    SprintModule,
    TaskModule,
    CommentModule,
    WorklogModule,
    StatisticsModule,
  ],
})
export class AppModule {}
