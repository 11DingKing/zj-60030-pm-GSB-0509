import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { PrismaModule } from '../common/prisma/prisma.module';
import { RedisModule } from '../common/redis/redis.module';

@Module({
  imports: [PrismaModule, RedisModule],
  providers: [ProjectService],
  controllers: [ProjectController],
  exports: [ProjectService],
})
export class ProjectModule {}
