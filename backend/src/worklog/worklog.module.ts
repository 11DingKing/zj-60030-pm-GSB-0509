import { Module } from '@nestjs/common';
import { WorklogService } from './worklog.service';
import { WorklogController } from './worklog.controller';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [WorklogService],
  controllers: [WorklogController],
  exports: [WorklogService],
})
export class WorklogModule {}
