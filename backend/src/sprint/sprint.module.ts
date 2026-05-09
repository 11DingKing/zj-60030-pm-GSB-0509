import { Module } from '@nestjs/common';
import { SprintService } from './sprint.service';
import { SprintController } from './sprint.controller';
import { PrismaModule } from '../common/prisma/prisma.module';
import { RedisModule } from '../common/redis/redis.module';

@Module({
  imports: [PrismaModule, RedisModule],
  providers: [SprintService],
  controllers: [SprintController],
  exports: [SprintService],
})
export class SprintModule {}
